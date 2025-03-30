---
title: PostgreSQL and ZFS filesystem
---

<UptraceCta />

<CoverImage title="Running PostgreSQL using ZFS and AWS EBS" />

This guide explains how to run PostgreSQL using ZFS filesystem. If you also need to install ZFS, see [Installing ZFS on Ubuntu](https://uptrace.dev/blog/ubuntu-install-zfs).

[[toc]]

## Overview

The main reason to use PostgreSQL with ZFS (instead of ext4/xfs) is data compression. Using LZ4, you can achieve 2-3x compression ratio which means that you need to write and read 2-3x less data. ZSTD offers even better compression at the expense of slightly higher CPU usage.

The second reason is Adaptive Replacement Cache (ARC). ARC is a page replacement algorithm with slightly better characteristics than Linux page cache. Since it caches compressed blocks, you can also fit more data in the same RAM.

## Basic ZFS setup

First, you need to create a separate pool for PostgreSQL:

```shell
zpool create -o autoexpand=on pg /dev/nvme1n1
```

And 2 datasets for PostgreSQL data and a write-ahead log (WAL):

```shell
# Move PostgreSQL files to a temp location.
mv /var/lib/postgresql/14/main/pg_wal /tmp/pg_wal
mv /var/lib/postgresql /tmp/postgresql

# Create datasets.
zfs create pg/data -o mountpoint=/var/lib/postgresql
zfs create pg/wal-14 -o mountpoint=/var/lib/postgresql/14/main/pg_wal

# Move PostgreSQL files back.
cp -r /tmp/postgresql/* /var/lib/postgresql
cp -r /tmp/pg_wal/* /var/lib/postgresql/14/main/pg_wal

# Fix permissions.
chmod 0750 /var/lib/postgresql
chmod 0750 /var/lib/postgresql/14/main/pg_wal
```

## ZFS config

Consider starting with the following ZFS configuration and tune it as you learn more:

```shell
# same as default
zfs set recordsize=128k pg

# enable lz4 compression
zfs set compression=lz4 pg
# or zstd compression
#zfs set compression=zstd-3 pg

# disable access time updates
zfs set atime=off pg

# enable improved extended attributes
zfs set xattr=sa pg

# same as default
zfs set logbias=latency pg

# reduce amount of metadata (may improve random writes)
zfs set redundant_metadata=most pg
```

## ZFS ARC size

By default, ZFS uses 50% of RAM for Adaptive Replacement Cache (ARC). You can consider increasing ARC to 70-80% of RAM, but make sure to leave enough memory for PostgreSQL `shared_buffers`:

```shell
# set ARC cache to 1GB
echo 1073741824 >> /sys/module/zfs/parameters/zfs_arc_max
```

To persist the ARC size change through Linux restarts, create `/etc/modprobe.d/zfs.conf`:

```shell
options zfs zfs_arc_max=1073741824
```

## ZFS recordsize

`recordsize` is the size of the largest block of data that ZFS will write and read. ZFS compresses each block individually and compression is better for larger blocks. Use the default `recordsize=128k` and decrease it to 32-64k if you need more TPS (transactions per second).

- Larger `recordsize` means better compression which improves performance if your queries read/write lots of data (tens of megabytes).
- Smaller `recordsize` means more TPS.

Setting `recordsize=8k` to match PostgreSQL block size reduces compression efficiency which is one of the main reasons to use ZFS in the first place. While `recordsize=8k` improves the average transaction rate as reported by pgbench, good pgbench result is not an indicator of good production performance. Measure performance of _your queries_ before lowering `recordsize`.

## ARC and shared_buffers

Since ARC caches compressed blocks, prefer using it over PostgreSQL `shared_buffers` for caching hot data. But making `shared_buffers` too small will negatively affect write speed. So consider lowering `shared_buffers` as long as your write speed does not suffer too much and leave the rest of the RAM for ARC.

## TOAST compression

To not compress data twice, you can disable PostgreSQL [TOAST](https://www.postgresql.org/docs/current/storage-toast.html) compression by setting column storage to `EXTERNAL`. But it does not make much difference:

- LZ4 is extremely fast.
- Both LZ4 and ZSTD have special logic to skip incompressible (or already compressed) parts of data.

## Alignment Shift

Use the default `ashift` value with Amazon Elastic Block Store and other cloud storages because EBS volume is not a single physical device but a logical volume that spans numerous distributed devices.

But if you know the sector size of the drive, it is worth it to configure `ashift` properly:

```shell
zpool create -o ashift=12 -o autoexpand=on pg /dev/nvme1n1
```

| ashift | Sector size |
| ------ | ----------- |
| 9      | 512 bytes   |
| 10     | 1 KB        |
| 11     | 2 KB        |
| 12     | 4 KB        |
| 13     | 8 KB        |
| 14     | 16 KB       |

## PostgreSQL full page writes

Because ZFS always writes full blocks, you can disable full page writes in PostgreSQL via `full_page_writes = off` setting.

## PostgreSQL block size and WAL size

The default PostgreSQL block size is 8k and it does not match ZFS record size (by default 128k). The result is that while PostgreSQL writes data in 8k blocks, ZFS has to work with 128k records (known as write amplification). You can improve this situation by increasing PostgreSQL block size to 32k and WAL block size to 64k. This requires re-compiling PostgreSQL and re-initializing a database.

- Larger `blocksize` considerably improves performance of the queries that read a lot of data (tens of megabytes). This effect is not specific to ZFS and you can use larger block sizes with other filesystems as well.
- Smaller `blocksize` means higher transaction rate per second.

## logbias

Use `logbias=latency`.

Quote from [@mercenary_sysadmin](https://www.reddit.com/r/zfs/comments/azt8sz/logbiasthroughput_without_a_slog/):

> logbias=throughput with no SLOG will likely improve performance if your workload is lots of big block writes, which is a workload that usually isn't suffering from performance issues much in the first place.

> Logbias=throughput with no SLOG and small block writes will result in the most horrific fragmentation imaginable, which will penalize you both in the initial writes AND when you reread that data from metal later.

Another one from [@taratarabobara ](https://www.reddit.com/r/zfs/comments/ayqw1r/zfs_heavy_write_amplification_due_to_free_space/ek9fsy4/):

> logbias=throughput will fragment every. Single. Block. Written to your pool.

> Normally ZFS writes data and metadata near sequentially, so they can be read with a single read IOP later. Indirect syncs (logbias=throughput) cause metadata and data to be spaced apart, and data spaced apart from data. Fragmentation results, along with very pool IO merge.

> If you want to see this in action, do "zfs send dataset >/dev/null" while watching "zpool iostat -r 1" in another window. You will see many, many 4K reads that cannot be aggregated with anything else. This is the cost of indirect sync, and you pay it at every single read.

> It should only be used in very specific circumstances.

## ZFS snapshots

If you are going to use ZFS snapshots, create a separate dataset for PostgreSQL WAL files. This way snapshots of your main dataset are smaller. Don't forget to backup WAL files separately so you can use [Point-in-Time Recovery](https://www.postgresql.org/docs/current/continuous-archiving.html).

But usually it is easier and cheaper to store backups on S3 using [pgbackrest](pgbackrest-s3-backups.md). Another popular option is EBS snapshots.

## See also

- [PostgreSQL + ZFS: Best Practices and Standard Procedures](https://people.freebsd.org/~seanc/postgresql/scale15x-2017-postgresql_zfs_best_practices.pdf)
- [OpenTelemetry Redis](https://uptrace.dev/guides/opentelemetry-redis)
- [OpenTelemetry Kubernetes](https://uptrace.dev/guides/opentelemetry-kubernetes)
