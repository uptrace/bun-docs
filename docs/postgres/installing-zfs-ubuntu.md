# Installing ZFS on Ubuntu

## Ubuntu repo

Ubuntu comes with the ZFS package, but it is usually a bit outdated:

```shell
sudo apt install zfsutils-linux
```

## jonathonf's PPA

To install the latest ZFS version, add jonathonf's PPA:

```shell
sudo add-apt-repository ppa:jonathonf/zfs
```

And then install ZFS and `zfs-dkms` to update ZFS Linux kernel modules:

```shell
sudo apt install zfsutils-linux zfs-dkms
```

## Compile from sources

You can also
[compile](https://openzfs.github.io/openzfs-docs/Developer%20Resources/Building%20ZFS.html) and
install ZFS from sources, but you will need to re-compile ZFS Linux kernel modules whenever Linix
kernel is updated.

Install dependencies:

```shell
sudo apt install build-essential autoconf automake libtool gawk alien fakeroot dkms libblkid-dev uuid-dev libudev-dev libssl-dev zlib1g-dev libaio-dev libattr1-dev libelf-dev linux-headers-$(uname -r) python3 python3-dev python3-setuptools python3-cffi libffi-dev python3-packaging git
```

Compile ZFS:

```shell
git clone https://github.com/openzfs/zfs
cd ./zfs
git checkout master
sh autogen.sh
./configure
make -s -j$(nproc)
```

Unmount existing ZFS datasets and export pools:

```shell
sudo zfs unmount -a
sudo zpool export -a
sudo systemctl stop zfs-send
```

Unload existing ZFS modules:

```shell
sudo ./scripts/zfs.sh -u
```

Install newly compiled ZFS:

```shell
sudo make install
sudo ldconfig
sudo depmod
```

Load freshly built Linux modules:

```shell
sudo ./scripts/zfs.sh
```

And make sure that ZFS services are enabled:

```shell
sudo systemctl enable zfs.target zfs-import.target zfs-mount.service zfs-import-cache.service zfs-import-scan.service
```
