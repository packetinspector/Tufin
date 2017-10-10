## Random Scripts for Tufin

##### Convert Tufin Network Objects to Palo Groups
Script will convert network objects and groups from ST into Palo objects. CKP, ASA, Stonesoft, Openstack, NSX, AWS are examples...
Makes use of pandevice
```
$ pip install pandevice
```

```bash
$ ./Tufin-Objects2Palo.py -d 8
Connecting to Firewall through Panorama
Adding Tufin Tag
Converting Objects
Ignoring Type: basicNetworkObjectDTO
Ignoring Type: basicNetworkObjectDTO
Ignoring Type: basicNetworkObjectDTO
Ignoring Type: basicNetworkObjectDTO
Found Subnet Object. Name: interface Datacenter IP: 10.3.3.1 / 255.255.255.255
Found Subnet Object. Name: interface External IP: 10.2.2.2 / 255.255.255.255
Found Subnet Object. Name: interface GigabitEthernet0/2 IP: 255.255.255.255 / 255.255.255.255
Found Subnet Object. Name: interface management IP: 10.100.200.109 / 255.255.255.255
Found Address Object. Name: 10.10.20.15 IP: 10.10.20.15
```


##### Backup Firewall Configs
Script will store most recent config from all devices
Makes use of pytos
```
$ pip install pytos
```

```bash
$ ./config-backup.py
Fethching Devices...
Getting config for RTR1-1
Success! Saving Config
Getting config for SRX-5
Success! Saving Config
Getting config for RTR2-7
Success! Saving Config
Getting config for ASAv-8
$ head -10 /tmp/tufin/RTR1-1.txt
!
!
version 15.4
service timestamps debug datetime msec
service timestamps log datetime msec
no platform punt-keepalive disable-kernel-core
platform console auto
!
hostname RTR1
!
```
