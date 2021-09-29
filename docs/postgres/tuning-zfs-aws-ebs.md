# Running PostgreSQL using ZFS and AWS EBS

This guide explains how to run and tune PostgreSQL + ZFS and AWS elastic block storage (and cloud
storage in general).

## Overview

The main reason to use PostgreSQL with ZFS (instead of ext4/xfs) is data compression. With
reasonable configuration you can achieve 2-3x compression ratio using LZ4. That means that LZ4
compresses 1 terabyte of data down to ~350 gigabytes. With ZSTD compression is even better.

The second reason is Adaptive Replacement Cache (ARC). ARC is a page replacement algorithm with
overall better characteristics than Linux page cache. Since it caches compressed blocks, you can
also fit more data in the same RAM.

You should start with the following configuration and tune it as you learn more:

- `recordsize=128k` - same as default.
- `compression=lz4` - enables lz4 compression (ZSTD with levels 1-6 is fine too).
- `atime=off` - disables access time update.
- `xattr=sa` - better extended attributes.
- `logbias=latency` - same as default.
- `redundant_metadata=most` - may improve random writes.

## ZFS recordsize

The `recordsize` is the size of the largest block of data that ZFS will read/write. ZFS compresses
each block individually and compression is better for larger blocks. Use the default
`recordsize=128k` and decrease it to 32-64k if you need more TPS (transactions per second).

- Larger `recordsize` means better compression. It also improves read/write performance if you
  select/insert lots of data (tens of megabytes).
- Smaller `recordsize` means more TPS.

Setting `recordsize=8k` to match PostgreSQL block size reduces compression efficiency (which is one
of the main reasons to use ZFS in the first place). While `recordsize=8k` improves the average
transaction rate as reported by pgbench, good pgbench result is not an indicator of good production
performance. Measure performance of _your queries_ before lowering `recordsize`.

## ARC and shared_buffers

Since ARC caches compressed blocks, prefer using it over PostgreSQL `shared_buffers` for caching hot
data. But making `shared_buffers` too small will negatively affect write speed. So consider lowering
`shared_buffers` as long as your write speed does not suffer too much and leave the rest of the RAM
for ARC.

## Disabling TOAST compression

To not compress data twice, you can disable PostgreSQL
[TOAST](https://www.postgresql.org/docs/current/storage-toast.html) compression by setting column
storage to `EXTERNAL`. But it does not make much difference:

- LZ4 is extremely fast.
- Both LZ4 and ZSTD have special logic to skip incompressible (or already compressed) parts of data.

## Alignment Shift (ashift)

Use the default `ashift` value with Amazon Elastic Block Store and other cloud stores. But if you
know the underlying hardware, it is worth it to configure `ashift` properly.

## Disabling PostgreSQL full page writes

Because ZFS always writes full blocks, you can disable full page writes in PostgreSQL via
`full_page_writes = off` setting.

## PostgreSQL block size and WAL size

The default PostgreSQL block size is 8k and it does not match ZFS record size (by default 128k). The
result is that while PostgreSQL writes data in 8k blocks, ZFS has to work with 128k records (known
as write amplification). You can improve this situation by increasing PostgreSQL block size to 32k
and WAL block size to 64k. This requires re-compiling PostgreSQL and re-initializing a database.

- Larger `blocksize` considerably improves performance of the queries that read a lot of data (tens
  of megabytes). This effect is not specific to ZFS and you can use larger block sizes with other
  filesystems as well.
- Smaller `blocksize` means higher transactions per second.

## logbias=latency

Quote from
[@mercenary_sysadmin](https://www.reddit.com/r/zfs/comments/azt8sz/logbiasthroughput_without_a_slog/):

> logbias=throughput with no SLOG will likely improve performance if your workload is lots of big
> block writes, which is a workload that usually isn't suffering from performance issues much in the
> first place.

> Logbias=throughput with no SLOG and small block writes will result in the most horrific
> fragmentation imaginable, which will penalize you both in the initial writes AND when you reread
> that data from metal later.

Another one from
[@taratarabobara ](https://www.reddit.com/r/zfs/comments/ayqw1r/zfs_heavy_write_amplification_due_to_free_space/ek9fsy4/):

> logbias=throughput will fragment every. Single. Block. Written to your pool.

> Normally ZFS writes data and metadata near sequentially, so they can be read with a single read
> IOP later. Indirect syncs (logbias=throughput) cause metadata and data to be spaced apart, and
> data spaced apart from data. Fragmentation results, along with very pool IO merge.

> If you want to see this in action, do "zfs send dataset >/dev/null" while watching "zpool iostat
> -r 1" in another window. You will see many, many 4K reads that cannot be aggregated with anything
> else. This is the cost of indirect sync, and you pay it at every single read.

> It should only be used in very specific circumstances.

## ZFS snapshots

If you are going to use ZFS snapshots, create a separate dataset for PostgreSQL WAL files. This way
snapshots of your main dataset are smaller. Don't forget to backup WAL files separately so you can
use [Point-in-Time Recovery](https://www.postgresql.org/docs/current/continuous-archiving.html).

But usually it is easier and cheaper to store backups on S3 (using
[pgbackrest](https://pgbackrest.org/)) or use EBS snapshots.

## Related material

- [PostgreSQL + ZFS: Best Practices and Standard Procedures](https://people.freebsd.org/~seanc/postgresql/scale15x-2017-postgresql_zfs_best_practices.pdf)
