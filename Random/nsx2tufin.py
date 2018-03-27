#!/usr/bin/python2
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
import ConfigParser
from pkg_resources import resource_filename
from nsxramlclient.client import NsxClient
import re
import time


def return_sgs():
    # Return a list of all the SGs installed in NSX Managers
    to_return = list()
    nsxmanager = config.get('nsxv', 'nsx_manager')
    nsxuser = config.get('nsxv', 'nsx_username')
    nsxpass = config.get('nsxv', 'nsx_password')

    nsxramlfile_dir = resource_filename(__name__, 'api_spec')
    nsxramlfile = '{}/nsxvapi.raml'.format(nsxramlfile_dir)
    # Too lazy...just hard code it for now
    nsxramlfile = '/usr/local/lib/python2.7/dist-packages/pynsxv/library/api_spec/nsxvapi.raml'

    #Connect to NSX Manager
    nsx_session = NsxClient(nsxramlfile, nsxmanager, nsxuser, nsxpass, debug=False)
    sgs = nsx_session.read('secGroupScope', uri_parameters={'scopeId': 'globalroot-0'})
    # sgs = get_secgroups(nsx_session, 'globalroot-0')
    sgs_list = sgs.items()[1][1]['list']['securitygroup']
    # print sgs_list
    for i, val in enumerate(sgs_list):
        # print i,val
        # print val['name']
        to_return.append(val['name'])
    return to_return


def postSA_XML(url, payload):
    # Post something to TOS
    headers = {
        'accept': "application/xml",
        'content-type': "application/xml",
        'cache-control': "no-cache"
        }
    st_ip = config.get('tufin', 'st')
    st_user = config.get('tufin', 'st_user')
    st_pass = config.get('tufin', 'st_pass')

    url = url.format(st_ip=st_ip)

    return requests.request("POST", url, data=payload, headers=headers, auth=(st_user, st_pass), verify=False)


def getSA_JSON(url):
    # Get something from TOS
    headers = {
        'accept': "application/json",
        'content-type': "application/json",
        'cache-control': "no-cache"
        }
    
    st_ip = config.get('tufin', 'st')
    st_user = config.get('tufin', 'st_user')
    st_pass = config.get('tufin', 'st_pass')

    url = url.format(st_ip=st_ip)

    return requests.request("GET", url, headers=headers, auth=(st_user, st_pass), verify=False).json()


def create_zone(zone_name):
    # Take SGs and make a zone for each
    xml = '''<zone>
    <name>{zone_name}</name>
    <comment>NSX SG</comment>
    </zone>'''
    url = 'https://{st_ip}/securetrack/api/zones/'
    # 400 zone exists, 201 all good
    r = postSA_XML(url, xml.format(zone_name=zone_name))
    if r.status_code == 201:
        u = r.headers['Location']
        id = re.match('.*?([0-9]+)$', u).group(1)
        zones[zone_name] = id
        return True
    else:
        return None


def create_pattern(zone_id, sg_name):
    # Take SGs and add them to the respective zone
    xml = '''<create_pattern_match_entry>
    <pattern_match_entry>
        <pattern>{sg_name}</pattern>
        <type>security_group_by_name</type>
    </pattern_match_entry>
    </create_pattern_match_entry>
    '''
    url = 'https://{st_ip}/securetrack/api/zones/{zone_id}/pattern-entries'
    url = url.format(zone_id=zone_id, st_ip='{st_ip}')
    # 201 all good 409 already present
    r = postSA_XML(url, xml.format(sg_name=sg_name))
    if r.status_code == 201:
        return True
    else:
        print "SG already present"
        return None


def get_all_zones():
    # Get all the zones in TOS
    to_return = {}
    url = 'https://{st_ip}/securetrack/api/zones/'
    z = getSA_JSON(url)
    try:
        for i in z['zones']['zone']:
            to_return[i['name']] = i['id']
    except:
        print "No Zones"
    return to_return


def make_usp(zone_list):
    # Create the USP text. Super basic.
    usp_header = "from domain,from zone,to domain,to zone,severity,access type,services,rule properties,flows\n"
    usp_line = "{domain},{zone_from},{domain},{zone_to},low,block all,,,\n"
    domain = 'Default'
    usp = ''
    usp = usp + usp_header
    for x in zone_list:
        for y in zone_list:
            usp = usp + usp_line.format(domain=domain, zone_from=x, zone_to=y)
    return usp


def upload_usp(usp_text, usp_name):
    # Setup
    url = 'https://{st_ip}/securetrack/api/security_policies'
    file = {'file': ('usp.csv', usp_text, 'text/csv')}
    param = {'context': 'Default', 'security_policy_name': usp_name}
    # Creds
    st_ip = config.get('tufin', 'st')
    st_user = config.get('tufin', 'st_user')
    st_pass = config.get('tufin', 'st_pass')
    # Post
    url = url.format(st_ip=st_ip)
    r = requests.request("POST", url, files=file, data=param, auth=(st_user, st_pass), verify=False)
    print r.status_code
    print r.text

# test = create_zone('joejoe')
# print test.status_code
# print test.headers
# print test.text

# test = create_pattern(95, 'secname')
# print test.status_code
# print test.headers
# print test.text

# print get_all_zones()

# Read config data
config = ConfigParser.ConfigParser()
config.read("nsx.ini")

# Do something with all the functions I wrote....
print "Getting Tufin Zones..."
zones = get_all_zones()
print "Getting NSX SGs...."
sgs = return_sgs()
# Add a prefix to each SG to make a zone name for clarity
sgs_with_prefix = list(map(lambda x: 'NSX_' + x, sgs))
print "Add Zones to Tufin..."
for s in sgs_with_prefix:
    if s in zones:
        print "Zone {} already in TOS. Skipping".format(s)
    else:
        print "Adding Zone to Tufin"
        create_zone(s)
print "Add SGs to Zones..."
for s in sgs:
    sh = 'NSX_' + s
    create_pattern(zones[sh], s)
upload_usp(make_usp(sgs_with_prefix), 'USP_NSX_' + str(int(round(time.time()))))
print "You USP is uploaded"