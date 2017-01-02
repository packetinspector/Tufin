$(function() {
    var usp_editor_version = 'Version 2.0B';


    var number_of_zones = 3;

//Global Var
    var current_cell;
    var exceptions = {};
//Structure for zone props
    var zone_types = [
    'allow all',
    'block all',
    'allow only',
    'block only'
    ];

    var flow_types = [
    '',
    'HOST_TO_HOST',
    'SUBNET_TO_HOST',
    'HOST_TO_SUBNET'
    ]

    var severity = [
    'low','medium','high','critical'
    ];

    var rule_props = [
        '',
        'EXPLICIT_SOURCE',
        'EXPLICIT_DESTINATION',
        'EXPLICIT_SERVICE',
        'HAS_COMMENT',
        'IS_LOGGED',
        'LAST_HIT_WITHIN {days:X}',
        'SOURCE_MAX_IP {count:X}',
        'DESTINATION_MAX_IP {count:X}',
        'SERVICE_MAX_SERVICES {count:X}'
    ];

    var usp_skel = {
        'zonetype': 0,
        'severity': 0,
        'flow_types': 0,
        'rule_props': [0],
        'services': ''
    };

    var exc_skel = {
      "security_policy_exception": {
          "name": "Name of Exception",
          "domain": {
            "name": "Default"
          },
          "expiration_date": "2070-04-01",
          "exempted_traffic_list": {
            "exempted_traffic": {
              "source_network_collection": {
                "exclude_any": false,
                "is_any": false,
                "negate": false,
                "network_items": {
                  "network_item": {
                    "@xsi.type": "subnet",
                    "ip": "192.168.60.10",
                    "prefix": "27"
                  }
                }
              },
              "dest_network_collection": {
                "exclude_any": false,
                "is_any": false,
                "negate": false,
                "network_items": {
                  "network_item": {
                    "@xsi.type": "subnet",
                    "ip": "172.16.40.40",
                    "prefix": "32"
                  }
                }
              },
              "service_collection": {
                "exclude_any": false,
                "is_any": false,
                "negate": false,
                "service_items": {
                  "service_item": {
                    "@xsi.type": "custom",
                    "port": 443,
                    "protocol": "tcp"
                  }
                }
              },
              "comment": "Traffic Comments",
              "status": "valid",
              "security_requirements": {
                "zone_to_zone_security_requirement": {
                  "from_domain": "Default",
                  "from_zone": "Cali_bckp-site",
                  "to_domain": "Default",
                  "to_zone": "Toronto",
                  "policy_name": "Corporate Matrix (Physical + AWS)"
                }
              }
            }
          }
        }
    };

   

    //Init all the form fields
    zone_types.forEach(function(item, index) {   
        $('#zonetype').append($("<option></option>").attr("value",index).text(item)); 
    });

    severity.forEach(function(item, index) {   
        $('#severity').append($("<option></option>").attr("value",index).text(item)); 
    });

    flow_types.forEach(function(item, index) {   
        $('#flow_types').append($("<option></option>").attr("value",index).text(item)); 
    });

    rule_props.forEach(function(item, index) {   
        $('#rule_props').append($("<option></option>").attr("value",index).text(item)); 
    });

    // $( "#zonetype" ).selectmenu();
    // $( "#severity" ).selectmenu();
    // $( "#flow_types" ).selectmenu();
    
    //Save all the form data into JSON into the cell
    function updateCell() {
        //Start the object
        fd = {}
        fd.zonetype = $("#zonetype option:selected").val();
        fd.severity = $("#severity option:selected").val();
        fd.flow_types = $("#flow_types option:selected").val();
        //Make array of props
        fd.rule_props = $("#rule_props option:selected").map(function () { return this.value }).get();
        //fd.services = $("#services").val();
        fd.services = $("#services_tags").tagit("assignedTags").join(";");
        //fd.rule_props = $("#rule_props option:selected").val([]);
        //console.log(fd);
        //Serialize
        current_cell.data(JSON.stringify(fd));
        //Color Cell
        $(current_cell.node()).removeClass("type_0 type_1 type_2 type_3").addClass('type_' + fd.zonetype);
        $("#detailsDialog").dialog( "close" );
        make_csv();
        
    }

    function post_ex() {
        usp_exception = exc_skel;
        //Grab Zone Names
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.security_requirements.zone_to_zone_security_requirement.to_zone = $(usp_table.column(current_cell.node()).header()).text();
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.security_requirements.zone_to_zone_security_requirement.from_zone = $(usp_table.row(current_cell.node()).node()).find('td:eq(0)').text();
        //Selected USP
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.security_requirements.zone_to_zone_security_requirement.policy_name = $('#usp_list').find('option:selected').text();
        //Form Data
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.source_network_collection.network_items.network_item.ip = $('#source_ip').val();
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.source_network_collection.network_items.network_item.prefix = $('#source_prefix').find('option:selected').val();
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.dest_network_collection.network_items.network_item.ip = $('#dest_ip').val();
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.dest_network_collection.network_items.network_item.prefix = $('#dest_prefix').find('option:selected').val();
        usp_exception.security_policy_exception.name = $('#ex_name').val();
        usp_exception.security_policy_exception.exempted_traffic_list.exempted_traffic.comment = $('#ex_comment').val();

        console.log(usp_exception);
        // $.post( "/securetrack/api/security_policies/exceptions", JSON.stringify(usp_exception), 'json').done(function( data ) {
        //     alert( "Data Loaded: " + data );
        // }).fail(function() {
        //     alert( "Failed to add Exception" );
        // });

        $.ajax({
          type: "POST",
          url: "/securetrack/api/security_policies/exceptions",
          data: JSON.stringify(usp_exception),
          dataType: 'json',
          contentType : 'application/json',
          statusCode: {
            201: function(r) {
                alert('Success!');
                import_exceptions();
                $("#detailsDialog").dialog( "close" );

            },
            400: function(r) {
                //Error
                message = /\<message\>(.*?)\<\/message\>/.exec(r.responseText);
                //console.log(message);
                alert(message[1]);
            }
          }
        })
    }

    //Edit form
    $("#detailsDialog").dialog({
            autoOpen: false,
            width: 500,
            close: function() {
                // form[0].reset();
                document.getElementById('detailsForm').reset();
                $("#detailsForm").find(".error").removeClass("error");
            },
            // buttons: {"Update": updateCell},
            position: { my: "center", at: "center top", of: window }
    });
    $("#wizard_dialog").dialog({
        autoOpen: false,
        width: 800,
        title: 'USP Wizard',
        close: function() {
            // form[0].reset();
            
        },
        // buttons: {"Update": updateCell},
        position: { my: "center", at: "center top", of: window }
    });
    //Name form
    $("#nameDialog").dialog({
            autoOpen: false,
            width: 800,
            close: function() {
                form[0].reset();
                $("#detailsForm").find(".error").removeClass("error");
            },
            buttons: {"Rename": function() {
                //Get name from form
                nn = $("#zone_name").val();
                if ($('th').map(function () { return $(this).text(); }).get().indexOf(nn) > 0) {
                    //Name in Use
                    alert('Name in use. Try again.');
                    $("#zone_name").addClass("error");
                } else {
                    //Update Cell
                    current_cell.data(nn);
                    //Find corresponding column and update
                    idx = current_cell.index();
                    idx = idx.row + 1;
                    $(usp_table.column(idx).header()).text(nn);
                    make_csv();
                    $( this ).dialog( "close" );
                }
            }}
    });


    //Prevent forms from doing anything
    form = $( document ).find( "form" ).on( "submit", function( event ) {
      event.preventDefault();
      });

    //Show the edit dialog, including data already present
    var showDetailsDialog = function() {
        var cell = current_cell.data();
        //console.log(cell);
        //If there's no data in the cell, use the defaults
        if (!cell) {
            //console.log("Empty Cell");
            var data = usp_skel;
        } else {
            var data = JSON.parse(cell);
            //var data = cell;
        }
        //console.log(data);
        //Clear select
        $("#detailsForm select").find('option').prop("selected",false);
        //Open Form
        $("#detailsDialog").dialog("option", "title", "Zone Edit").dialog("open").dialog( "moveToTop" );
        //Set selected options
        $("#zonetype").find("option[value=" + data.zonetype + "]").prop("selected","selected");
        $("#severity").find("option[value=" + data.severity + "]").prop("selected","selected");
        $("#flow_types").find("option[value=" + data.flow_types + "]").prop("selected","selected");
        data.rule_props.forEach(function(item, index) {
            $("#rule_props").find("option[value=" + item + "]").prop("selected","selected");
        });
        //$("#services").val(data.services);
        if ( $("#services_tags").hasClass('tagit-hidden-field')) {
            $("#services_tags").tagit("removeAll");
            console.log('Removing Tags');
            data.services.split(";").forEach(function (item,index) {
                $("#services_tags").tagit("createTag", item);

            });
        } else {
            $("#services_tags").val(data.services);
            $("#services_tags").tagit({
                    availableTags: services_available,
                    singleFieldDelimiter: ";",
                    singleField: true,
                    allowSpaces: true,
                    singleFieldNode: $("#services_tags")
                });
        }
        // Lets look for exceptions
        $("#ex_list").empty();
        to = $(usp_table.column(current_cell.node()).header()).text();
        from = $(usp_table.row(current_cell.node()).node()).find('td:eq(0)').text();
        ind = from + to;
        if (exceptions[ind]) {
            exceptions[ind].forEach(function (item, index) {
                $("#ex_list").append('<li class="ex" zone="' + ind + '">' + item.name + '</li>');
            });
        } else {
            $("#ex_list").append('<p>None</p>');
        }
    };

    //Show form for zone name edit
    function showRenameDialog(e) {
        current_cell = usp_table.cell(e);
        $("#nameDialog").dialog("option", "title", "Rename Zone").dialog("open");
        $("#zone_name").val(current_cell.data());
        //console.log(usp_table.columns)
    }

    //Make buttons into buttons
    $('button').button();
    //Make Tabs
    $( "#tabs" ).tabs({active: 0});

    //Now working
    $("#add_zone").on("click", function() {
        //console.log("adding zone");
        make_csv();
        import_csv($("#output").val(), true);
    }).show();

    //Give the button a purpose
    $("#export").on("click", function() {
        make_csv();
    });

    $("#update_zone").on("click", function() {
        updateCell();
        $("#detailsDialog").dialog( "close" );
    });

    $("#add_ex").on("click", function() {
        post_ex();
        // $("#detailsDialog").dialog( "close" );
    });

    $("#reset_ex").on("click", function() {
        document.getElementById('ex_form').reset();
    });

    $("#get_exceptions").on("click", function() {
        import_exceptions();
    });

    $("#button_inst").on("click", function() {
        $("#instructions").toggle();
    });

    $("#button_about").on("click", function() {
        $("#about").toggle();
    });

    $("#wizard_button").on("click", function() {
        $("#wizard_dialog").dialog( "open" );
        $("#device_fetch").show();
        $("#interfaces_button").hide();
        $("#interface_fetch").hide();
        
    });

    $("#df_button").on("click", function() {
        $("#devices_list").empty();
        $.getJSON( "/securetrack/api/devices/", function(data) {
            //Let's add a control group
            $("#devices_list").append('<fieldset><legend>Devices</legend><div id="devicegroup" class="device_group_class"></div></fieldset>');
            data.devices.device.forEach(function (item, i) {
                //console.log(item);
                $("#devicegroup").append('<label><input type="checkbox" id="device_boxes" value="' + item.id + '" fw_name="' + item.name +'">' + item.name + '(' + item.vendor + ')' + '</label>');
            });
            $("#devicegroup").controlgroup({"direction": "horizontal"});
            $("#devices_list").append('<p>Check the devices you want to use and click load interfaces</p>')
            //Show Different Button
            $("#interfaces_button").show();

        });
    });

    $("#interfaces_button").on("click", function() {
        $("#interfaces_list").empty();
        device_ids = $("#device_boxes:checked").map(function () { return this.value}).get();
        device_names = $("#device_boxes:checked").map(function () { return $(this).attr('fw_name')}).get();
        console.log(device_ids,device_names);
        if (device_ids.length) {
            //We have devices, let's start a new form
            $("#device_fetch").hide();
            $("#interface_fetch").show();
            device_ids.forEach(function(item, index) {
                console.log(item);
                $("#interfaces_list").append('<fieldset><legend>' + device_names[index] + '</legend><div id="interfacegroup' + index + '" class="interface_group_class"></div></fieldset>');
                $.getJSON( `/securetrack/api/devices/${item}/interfaces`, function(data) {
                    console.log(data);
                    if (data.interfaces.interface) {
                        if (data.interfaces.interface.forEach) {
                            data.interfaces.interface.forEach(function (iface, ifnum) {
                                if (iface.interface_ips) {
                                    $('#interfacegroup' + index).append(`<label><input type="checkbox" id="interface_boxes" value="${iface.id}">${iface.interface_ips.interface_ip.ip}/${iface.interface_ips.interface_ip.netmask}</label>`);
                                }
                            });
                        } else {
                            if (data.interfaces.interface.interface_ips) {
                                $('#interfacegroup' + index).append(`<label><input type="checkbox" id="interface_boxes" value="${data.interfaces.interface.id}">${data.interfaces.interface.interface_ips.ip}/${iface.interface_ips.interface_ip.netmask}</label>`);
                            }
                        }
                    }
                    // $("#interfaces_list")
                    $('#interfacegroup' + index).controlgroup({"direction": "horizontal"});
                });
            });
            $("#interfaces_button").hide();
            $("#makezones_button").show();

        } else {
            alert('Select Devices First');
        }

    });

    $("#makezones_button").on("click", function() {
        interface_ids = $("#interface_boxes:checked").map(function () { return this.value}).get();
        console.log(interface_ids);
        alert('Come back soon');
    });



    $("#get_usps").on("click", function () {
        $.getJSON( "/securetrack/api/security_policies/", function(data) {
              console.log( "success" );
              console.log(data);
              console.log(data.SecurityPolicyList.securityPolicies.securityPolicy);
              //Clear select
              $('#usp_list').empty();
              $('#usp_list').append($("<option></option>").attr("value",0).text("Choose USP"));
              data.SecurityPolicyList.securityPolicies.securityPolicy.forEach(function(item, index) {   
                    $('#usp_list').append($("<option></option>").attr("value",item.id).text(item.name)); 
                });
            })
          .fail(function() {
            alert( "Failed to fetch USPs" );
          });
    });

    $('#usp_list').change(function() {
        //console.log(this);
        //console.log($(this).find('option:selected').attr("value"));
        usp_id = $(this).find('option:selected').attr("value");
        $.get('/securetrack/api/security_policies/' + usp_id + '/export', function(data) {
            //console.log(data);
            $("#output").val(data);
            import_csv($("#output").val());
        }).fail(function() {
            alert("Failed to Fetch USP");
        });
    });

    $("#get_zones").on("click",function fetch_zones() {
        $.getJSON("/securetrack/api/zones/", function(data) {
            console.log("success");
            console.log("Found " + data.zones.count + " Zones");
            console.log(data.zones);
            //Empty the zones to avoid dupes
            $('#server_zones').empty()
            //Add zones the user is currently working with
            $('#uspgrid tr td:first-child').each(function() {
                $('#server_zones').append($("<option></option>").attr("value",$(this).text()).text($(this).text()));
            });
            //Add zones from api
            data.zones.zone.forEach(function(item, index) {   
                $('#server_zones').append($("<option></option>").attr("value",item.name).text(item.name)); 
            });
        }).fail(function() {
            alert("Failed to fetch Zones");
        });
    });

    $("#import_button").on("click", function() {
        import_csv($("#output").val());
    });

    function import_exceptions() {
        console.log("Fetching Exceptions")
        exceptions = {};
        $.getJSON( "/securetrack/api/security_policies/exceptions", function(data) {
            // console.log(data);
            if (! Array.isArray(data.security_policy_exception_list.security_policy_exception)) {
                e = [].concat(data.security_policy_exception_list.security_policy_exception);
            } else {
                e = data.security_policy_exception_list.security_policy_exception;
            }
            e.forEach(function(item, index) { 
                console.log(item);
                // console.log(item.name);
                g = {};
                g.name = item.name
                g.policy_name = item.exempted_traffic_list.exempted_traffic.security_requirements.zone_to_zone_security_requirement.policy_name;
                g.comment = item.exempted_traffic_list.exempted_traffic.comment;
                g.create_date = item.creation_date;
                g.expire_date = item.expiration_date;
                g.traffic = item.exempted_traffic_list.exempted_traffic;
                f = item.exempted_traffic_list.exempted_traffic.security_requirements.zone_to_zone_security_requirement.from_zone;
                t = item.exempted_traffic_list.exempted_traffic.security_requirements.zone_to_zone_security_requirement.to_zone;
                //console.log(g);
                ind = f + t;
                if (! exceptions[ind]) {
                    exceptions[ind] = [];
                }
                exceptions[ind].push(g);
            });

             //Refind exceptions
            $('#uspgrid tr td:not(:first-child)').each(function() {
                //console.log(this);
                current_cell = usp_table.cell(this);
                $(current_cell.node()).removeClass("exceptions");
                //Grab the zones based on cell
                to = $(usp_table.column(this).header()).text();
                from = $(usp_table.row(this).node()).find('td:eq(0)').text();
                ind = from + to;
                if (exceptions[ind]) {
                    $(current_cell.node()).addClass('exceptions');
                }
            });
        });
        // console.log("Found: ")
        // console.log(exceptions);
    }

    function import_csv (uspstuff, add_new=false) {
        //Now we parse the text
        lines = uspstuff.trim().split("\n");
        //We don't need the row header
        lines.splice(0,1);
        //Number of zones
        nz = Math.sqrt(lines.length);
        if (!Number.isInteger(nz)) {
            alert('Error in CSV');
        }
        two_d = lines.map(function(line) {
            return line.replace(/\"/g,"").split(",");
        })
        //I'd like to trust the CSV is in order but...
        from_cols = two_d.map(function(value,index) { return value[1]; });
        to_cols = two_d.map(function(value,index) { return value[3]; });
        //Find the uniques and assign them a position
        unique_from = Array.from(new Set(from_cols));
        //Now we build the datatable array
        dt_cols = [{ title: 'From/To', width: 50, className: "ui-state-default sorting_disabled misc" }];
        dt_rows = [];
        //Array of column numbers 1->nz
        dt_render_cols = [];
        for (i=1; i<nz+1; i++) {
            //No need to get fancy, we already need to loop
            dt_render_cols.push(i);
            dt_cols.push({title: unique_from[i-1]});
            row = Array(nz).fill('');
            row.unshift(unique_from[i-1]);
            dt_rows.push(row);
        }
        //Now all the rows
        two_d.forEach(function(item, index) {
            //Line up the row/col for entry
            //console.log(item);
            row = unique_from.indexOf(item[1]);
            col = unique_from.indexOf(item[3]) + 1;
            //console.log(row,col);
            temp_skel = usp_skel;
            temp_skel.zonetype = zone_types.indexOf(item[5]) || 0;
            temp_skel.severity = severity.indexOf(item[4]) || 0;
            temp_skel.services = item[6];
            temp_skel.flow_types = flow_types.indexOf(item[8]);
            //No support for number fields, normallize with regex first
            nr = item[7].replace(/\:\d+\}/g, ":X}");
            temp_skel.rule_props = nr.split(";").map(function(value, index) { return rule_props.indexOf(value);});
            dt_rows[row][col] = JSON.stringify(temp_skel);

        });

        

        console.log("Importing " + nz + " Zones");
        console.log(two_d);
        console.log(from_cols);
        console.log(to_cols);
        console.log(unique_from);
        console.log("New Fill");
        console.log(dt_render_cols,dt_cols,dt_rows);
        //Reinit
        //init(dt_rows,dt_cols, dt_render_cols, false);
        if (add_new) {
            //Add a new zone while where at it
            new_name = 'New Zone ' + (nz+1);
            new_zone = new Array(nz).fill(JSON.stringify(usp_skel));
            new_zone.unshift(new_name);
            dt_rows.push(new_zone);
            console.log(dt_rows);
            dt_cols.push({title: new_name});
            //Fill in the blank zone
            dt_rows.map(function(value, index) { return value.push(JSON.stringify(usp_skel));})            
            dt_render_cols.push(nz+1);

            }

        init(dt_rows,dt_cols, dt_render_cols, false)

        
    }

    //Loop through data cells and output csv into textarea
    function make_csv () {
        header = "from domain,from zone,to domain,to zone,severity,access type,services,rule properties,flows";
        ta = $("#output");
        ta.val('');
        ta.val(header);
        domain = $("#default_domain").val();
        $('#uspgrid tr td:not(:first-child)').each(function(index, value) {
            //Start array that we'll join later
            r = [];
            //console.log(value);
            //Grab the cell were on
            c = usp_table.cell(this);
            //Parse the JSON out
            cd = JSON.parse(c.data());
            //Grab the zones based on cell
            to = $(usp_table.column(this).header()).text();
            from = $(usp_table.row(this).node()).find('td:eq(0)').text();
            //console.log("From:" + from + " To: " + to);
            //Start pushing
            r.push(domain,from,domain,to,severity[cd.severity], zone_types[cd.zonetype]);
            //Services
            r.push(cd.services)
            //Props
            p = [];
            cd.rule_props.forEach(function(item, index) {
                p.push(rule_props[item]);
            });
            r.push(p.join(";"));
            //flows
            r.push(flow_types[cd.flow_types])
            //console.log(r);
            //Output line
            ta.val(ta.val() + "\n" + r.join(","));

        })
    }


    function init(dt_rows,dt_cols, dt_render_cols, first=true) {
        //All done now we remake the table
        if (!first) {
            usp_table.destroy();
        }
        $('#uspgrid').empty();
        //Setup DataTables
        //Using a render to show ZoneType instead of JSON string.
        usp_table = $('#uspgrid').DataTable( {
            //data: [['Zone 1', '', '',''],['Zone 2', '', '',''],['Zone 3','','','']],
            //columns: [ { title: 'From/To', width: 50 }, {title: 'Zone 1', width: 200}, {title: 'Zone 2', width: 200}, {title: 'Zone 3', width: 200}],
            data: dt_rows,
            columns: dt_cols,
            "paging": false,
            "ordering": false,
            "info": false,
            "searching": false,
            "columnDefs": [ {
                "targets": dt_render_cols,
                "render": function (data, type, full, meta) {
                            if ( type === 'display' && data) {
                                o = JSON.parse(data);
                                //console.log(meta);
                                return "<b>" + zone_types[o.zonetype] + "</b>"
                        } else {
                            return data
                        }
                        }
                }]
        });
            //Click on cells to edit
        $('#uspgrid tr td:not(:first-child)').on("click", function() {
            //console.log(this);
            current_cell = usp_table.cell(this);
            //Reset EX form
            //document.getElementById('ex_form').reset();
            showDetailsDialog(this);
        });

        //Click on Headers to Edit
        $('#uspgrid tr td:first-child').on("click", function() {
            //console.log(this);
            current_cell = usp_table.cell(this);
            idx = usp_table.row(this).index();
            showRenameDialog(this);
        
        });

        //Color rows
        $('#uspgrid tr td:not(:first-child)').each(function() {
            //console.log(this);
            current_cell = usp_table.cell(this);
            fd = JSON.parse(current_cell.data());
            //Color Cell
            $(current_cell.node()).removeClass("type_0 type_1 type_2 type_3 exceptions").addClass('type_' + fd.zonetype);
            //Grab the zones based on cell
            to = $(usp_table.column(this).header()).text();
            from = $(usp_table.row(this).node()).find('td:eq(0)').text();
            ind = from + to;
            if (exceptions[ind]) {
                $(current_cell.node()).addClass('exceptions');
            }
        });

    }

    var usp_table;
    var on_server = false;
    var services_available = [ "AOL", "AP-Defender", "AT-Defender", "BGP", "Citrix_ICA", "CP_Exnet_PK", "CP_Exnet_resolve", "CP_redundant", "CP_reporting", "CP_rtm", "CP_seam", "CP_SmartPortal", "CP_SSL_Network_Extender", "CPD", "CPD_amon", "CPMI", "daytime-tcp", "discard-tcp", "domain-tcp", "echo-tcp", "EDGE", "Entrust-Admin", "Entrust-KeyMgmt", "epmap-tcp", "exec", "FIBMGR", "finger", "ftp", "FW1", "FW1_amon", "FW1_clntauth_http", "FW1_clntauth_telnet", "FW1_CPRID", "FW1_cvp", "FW1_ela", "FW1_ica_mgmt_tools", "FW1_ica_pull", "FW1_ica_push", "FW1_ica_services", "FW1_key", "FW1_lea", "FW1_log", "FW1_mgmt", "FW1_netso", "FW1_omi", "FW1_omi-sic", "FW1_pslogon", "FW1_pslogon_NG", "FW1_sam", "FW1_sds_logon", "FW1_sds_logon_NG", "FW1_snauth", "FW1_topo", "FW1_uaa", "FW1_ufp", "gopher", "GoToMyPC", "H323", "http", "HTTP_and_HTTPS_proxy", "https", "ident", "IKE-tcp", "imap", "IMAP-SSL", "IPSO_Clustering_Mgmt_Protocol", "irc2", "Kerberos_v5_TCP", "ldap", "ldap-ssl", "login", "lotus", "lpdw0rm", "microsoft-ds", "MS-SQL-Monitor", "MS-SQL-Server", "MSNP", "MySQL", "nbsession", "NCP", "netshow", "netstat", "nfsd-tcp", "nntp", "ntp-tcp", "OAS-NameServer", "OAS-ORB", "pcANYWHERE-data", "pcTELECOMMUTE-FileSync", "pop-2", "pop-3", "POP3S", "PostgreSQL", "pptp-tcp", "RainWall_Command", "Real-Audio", "RealSecure", "Remote_Debug", "Remote_Desktop_Protocol", "rtsp", "SCCP", "securidprop", "shell", "sip_tls", "sip-tcp", "smtp", "SMTPS", "sqlnet1-2", "sqlnet2-1525", "sqlnet2-1526", "Squid_NTLM", "ssh", "StoneBeat-Control", "StoneBeat-Daemon", "T.120", "TACACSplus", "tcp-high-ports", "telnet", "time-tcp", "UserCheck", "uucp", "wais", "X11", "Yahoo_Messenger_messages", "Yahoo_Messenger_Voice_Chat_TCP", "Yahoo_Messenger_Webcams", "Service Name", "biff", "bootp", "Citrix_ICA_Browsing", "daytime-udp", "dhcp", "discard-udp", "domain-udp", "E2ECP", "echo-udp", "epmap-udp", "FW1_load_agent", "FW1_scv_keep_alive", "FW1_snmp", "H323_ras", "Hotline_tracker", "ICQ_locator", "IKE", "IKE_NAT_TRAVERSAL", "Kerberos_v5_UDP", "kerberos-udp", "L2TP", "ldap-udp", "MetaIP-UAT", "mgcp_CA", "mgcp_MG", "microsoft-ds-udp", "MS-SQL-Monitor_UDP", "MS-SQL-Server_UDP", "MSN_Messenger_1863_UDP", "MSN_Messenger_5190", "MSN_Messenger_Voice", "name", "nbdatagram", "nbname", "NEW-RADIUS-ACCOUNTING", "NEW-RADIUS-ACCOUNTING", "nfsd", "ntp-udp", "pcANYWHERE-stat", "RADIUS", "RADIUS-ACCOUNTING", "RainWall_Daemon", "RainWall_Status", "RainWall_Stop", "RDP", "rip", "RIPng", "securid-udp", "sip", "snmp", "SWTP_Gateway", "SWTP_SMS", "syslog", "TACACS", "tftp", "time-udp", "tunnel_test", "udp-high-ports", "VPN1_IPSEC_encapsulation", "wap_wdp", "wap_wdp_enc", "wap_wtp", "wap_wtp_enc", "who", "Service Name", "dest-unreach", "echo-reply", "echo-request", "info-reply", "info-req", "mask-reply", "mask-request", "param-prblm", "redirect", "source-quench", "time-exceeded", "timestamp", "timestamp-reply", "Service Name", "AH", "egp", "ESP", "FW1_Encapsulation", "ggp", "gre", "icmp-proto", "igmp", "igrp", "IP_Mobility", "ospf", "PIM", "SIT", "Sitara", "SKIP", "SUN_ND", "SWIPE", "vrrp"]; 
    //Create initial Data and column definition
    col = [{ title: 'From/To', width: "100px", className: "ui-state-default sorting_disabled misc" }];
    table_data = [];
    cols = [];

    for(i=1; i < number_of_zones+1; i++) {
        n = 'Zone ' + (i);
        col.push({title: n});
        //Make a row default objects
        row = Array(number_of_zones).fill(JSON.stringify(usp_skel));
        //Prepend column index
        row.unshift(n);
        //Add to data arrays
        table_data.push(row);
        cols.push(i);
    }        
    console.log("Original Fill");
    console.log(cols);
    console.log(col);
    console.log(table_data);
    //Go for it
    init(table_data, col, cols);

    //Make a tool tip to see entered data
    $( document ).tooltip({
        items: "td",
        track: true,
        classes: { "ui-tooltip" : "ruleprops"},
        content: function() {
            //
            idx = usp_table.row(this).index();
            from_z = usp_table.cell(idx,0).data();
            //
            idx = usp_table.cell( this ).index().column;
            e = usp_table.column(idx).header()
            if (idx === 0) {
                return null
            }
            to_z = $(e).text();
            //
            cc = usp_table.cell(this);
            cd = cc.data();
            if (cd) {
                cd = JSON.parse(cc.data());
                s = 'From: <b>' + from_z + '</b> To: <b>' + to_z + '</b><br>';
                s = s + 'Zone Type: ' + zone_types[cd.zonetype] + '<br>';
                s = s + 'Severity: ' + severity[cd.severity] + '<br>';
                if (cd.rule_props[0] == 0) {
                    s = s + 'Rule Properties: None<br>';
                } else {
                    s = s + 'Rule Properties: <li>' + cd.rule_props.map(function (i) { return rule_props[i];}).join("<li>") + '<br>';
                }
                s = s + 'Services: ' + cd.services + '<br>';
                return s
            } else {
                return null
            }
        }
    });

    function traverse(jsonObj) {
        if( typeof jsonObj == "object" ) {
            $.each(jsonObj, function(k,v) {
                // index. make it a header
                r = r + '<tr><td>' + k + '</td>';
                traverse(v);
                r= r + '</tr>';
            });
        }
            else {
                // output
                r = r + '<td>' + jsonObj + '</td>';
            }
    }

    $( document ).tooltip({
        items: "li.ex",
        track: true,
        classes: { "ui-tooltip" : "ruleprops"},
        content: function() {
            n = $(this).text();
            i = $(this).attr('zone');
            //Go through exceptions
            //
            // 
            
            if (exceptions[i]) {
                exceptions[i].forEach(function(item, index) {
                    if (item.name == n) {
                        found = item;
                        return;
                    }
                });
                if (found) {
                    // Find a better way to parse/display the return, this will work for now
                    r = '';
                    traverse(found);
                    out = '<table>' + r + '</table>';
                    return out
                }
            }
            return 'No Data'
        }
    });

    //Display version
    $('#version_text').text(usp_editor_version);
    //Hide things
    $('#about').hide();
    $('#instructions').hide();

    if (document.location.href.includes('file://') || document.location.href.includes('codepen')){
        // We are offline. hide the things
        $("#online_menu_bar").hide();
        $("#online_selections").hide();
        $('#online').hide();
    } else {
        // online, load the things
        on_server = true;
        $("#get_usps").click();
        $('#offline').hide();
        $("#get_zones").click();
        $('#server_zones').change(function() {
            zone_name = $(this).find('option:selected').attr("value");
            $("#zone_name").val(zone_name);
        });
        import_exceptions();

    }
});

//UI-Tagit https://github.com/aehlke/tag-it/
(function(b){b.widget("ui.tagit",{options:{allowDuplicates:!1,caseSensitive:!0,fieldName:"tags",placeholderText:null,readOnly:!1,removeConfirmation:!1,tagLimit:null,availableTags:[],autocomplete:{},showAutocompleteOnFocus:!1,allowSpaces:!1,singleField:!1,singleFieldDelimiter:",",singleFieldNode:null,animate:!0,tabIndex:null,beforeTagAdded:null,afterTagAdded:null,beforeTagRemoved:null,afterTagRemoved:null,onTagClicked:null,onTagLimitExceeded:null,onTagAdded:null,onTagRemoved:null,tagSource:null},_create:function(){var a=
this;this.element.is("input")?(this.tagList=b("<ul></ul>").insertAfter(this.element),this.options.singleField=!0,this.options.singleFieldNode=this.element,this.element.addClass("tagit-hidden-field")):this.tagList=this.element.find("ul, ol").andSelf().last();this.tagInput=b('<input type="text" />').addClass("ui-widget-content");this.options.readOnly&&this.tagInput.attr("disabled","disabled");this.options.tabIndex&&this.tagInput.attr("tabindex",this.options.tabIndex);this.options.placeholderText&&this.tagInput.attr("placeholder",
this.options.placeholderText);this.options.autocomplete.source||(this.options.autocomplete.source=function(a,e){var d=a.term.toLowerCase(),c=b.grep(this.options.availableTags,function(a){return 0===a.toLowerCase().indexOf(d)});this.options.allowDuplicates||(c=this._subtractArray(c,this.assignedTags()));e(c)});this.options.showAutocompleteOnFocus&&(this.tagInput.focus(function(b,d){a._showAutocomplete()}),"undefined"===typeof this.options.autocomplete.minLength&&(this.options.autocomplete.minLength=
0));b.isFunction(this.options.autocomplete.source)&&(this.options.autocomplete.source=b.proxy(this.options.autocomplete.source,this));b.isFunction(this.options.tagSource)&&(this.options.tagSource=b.proxy(this.options.tagSource,this));this.tagList.addClass("tagit").addClass("ui-widget ui-widget-content ui-corner-all").append(b('<li class="tagit-new"></li>').append(this.tagInput)).click(function(d){var c=b(d.target);c.hasClass("tagit-label")?(c=c.closest(".tagit-choice"),c.hasClass("removed")||a._trigger("onTagClicked",
d,{tag:c,tagLabel:a.tagLabel(c)})):a.tagInput.focus()});var c=!1;if(this.options.singleField)if(this.options.singleFieldNode){var d=b(this.options.singleFieldNode),f=d.val().split(this.options.singleFieldDelimiter);d.val("");b.each(f,function(b,d){a.createTag(d,null,!0);c=!0})}else this.options.singleFieldNode=b('<input type="hidden" style="display:none;" value="" name="'+this.options.fieldName+'" />'),this.tagList.after(this.options.singleFieldNode);c||this.tagList.children("li").each(function(){b(this).hasClass("tagit-new")||
(a.createTag(b(this).text(),b(this).attr("class"),!0),b(this).remove())});this.tagInput.keydown(function(c){if(c.which==b.ui.keyCode.BACKSPACE&&""===a.tagInput.val()){var d=a._lastTag();!a.options.removeConfirmation||d.hasClass("remove")?a.removeTag(d):a.options.removeConfirmation&&d.addClass("remove ui-state-highlight")}else a.options.removeConfirmation&&a._lastTag().removeClass("remove ui-state-highlight");if(c.which===b.ui.keyCode.COMMA&&!1===c.shiftKey||c.which===b.ui.keyCode.ENTER||c.which==
b.ui.keyCode.TAB&&""!==a.tagInput.val()||c.which==b.ui.keyCode.SPACE&&!0!==a.options.allowSpaces&&('"'!=b.trim(a.tagInput.val()).replace(/^s*/,"").charAt(0)||'"'==b.trim(a.tagInput.val()).charAt(0)&&'"'==b.trim(a.tagInput.val()).charAt(b.trim(a.tagInput.val()).length-1)&&0!==b.trim(a.tagInput.val()).length-1))c.which===b.ui.keyCode.ENTER&&""===a.tagInput.val()||c.preventDefault(),a.options.autocomplete.autoFocus&&a.tagInput.data("autocomplete-open")||(a.tagInput.autocomplete("close"),a.createTag(a._cleanedInput()))}).blur(function(b){a.tagInput.data("autocomplete-open")||
a.createTag(a._cleanedInput())});if(this.options.availableTags||this.options.tagSource||this.options.autocomplete.source)d={select:function(b,c){a.createTag(c.item.value);return!1}},b.extend(d,this.options.autocomplete),d.source=this.options.tagSource||d.source,this.tagInput.autocomplete(d).bind("autocompleteopen.tagit",function(b,c){a.tagInput.data("autocomplete-open",!0)}).bind("autocompleteclose.tagit",function(b,c){a.tagInput.data("autocomplete-open",!1)}),this.tagInput.autocomplete("widget").addClass("tagit-autocomplete")},
destroy:function(){b.Widget.prototype.destroy.call(this);this.element.unbind(".tagit");this.tagList.unbind(".tagit");this.tagInput.removeData("autocomplete-open");this.tagList.removeClass("tagit ui-widget ui-widget-content ui-corner-all tagit-hidden-field");this.element.is("input")?(this.element.removeClass("tagit-hidden-field"),this.tagList.remove()):(this.element.children("li").each(function(){b(this).hasClass("tagit-new")?b(this).remove():(b(this).removeClass("tagit-choice ui-widget-content ui-state-default ui-state-highlight ui-corner-all remove tagit-choice-editable tagit-choice-read-only"),
b(this).text(b(this).children(".tagit-label").text()))}),this.singleFieldNode&&this.singleFieldNode.remove());return this},_cleanedInput:function(){return b.trim(this.tagInput.val().replace(/^"(.*)"$/,"$1"))},_lastTag:function(){return this.tagList.find(".tagit-choice:last:not(.removed)")},_tags:function(){return this.tagList.find(".tagit-choice:not(.removed)")},assignedTags:function(){var a=this,c=[];this.options.singleField?(c=b(this.options.singleFieldNode).val().split(this.options.singleFieldDelimiter),
""===c[0]&&(c=[])):this._tags().each(function(){c.push(a.tagLabel(this))});return c},_updateSingleTagsField:function(a){b(this.options.singleFieldNode).val(a.join(this.options.singleFieldDelimiter)).trigger("change")},_subtractArray:function(a,c){for(var d=[],f=0;f<a.length;f++)-1==b.inArray(a[f],c)&&d.push(a[f]);return d},tagLabel:function(a){return this.options.singleField?b(a).find(".tagit-label:first").text():b(a).find("input:first").val()},_showAutocomplete:function(){this.tagInput.autocomplete("search",
"")},_findTagByLabel:function(a){var c=this,d=null;this._tags().each(function(f){if(c._formatStr(a)==c._formatStr(c.tagLabel(this)))return d=b(this),!1});return d},_isNew:function(a){return!this._findTagByLabel(a)},_formatStr:function(a){return this.options.caseSensitive?a:b.trim(a.toLowerCase())},_effectExists:function(a){return Boolean(b.effects&&(b.effects[a]||b.effects.effect&&b.effects.effect[a]))},createTag:function(a,c,d){var f=this;a=b.trim(a);this.options.preprocessTag&&(a=this.options.preprocessTag(a));
if(""===a)return!1;if(!this.options.allowDuplicates&&!this._isNew(a))return a=this._findTagByLabel(a),!1!==this._trigger("onTagExists",null,{existingTag:a,duringInitialization:d})&&this._effectExists("highlight")&&a.effect("highlight"),!1;if(this.options.tagLimit&&this._tags().length>=this.options.tagLimit)return this._trigger("onTagLimitExceeded",null,{duringInitialization:d}),!1;var g=b(this.options.onTagClicked?'<a class="tagit-label"></a>':'<span class="tagit-label"></span>').text(a),e=b("<li></li>").addClass("tagit-choice ui-widget-content ui-state-default ui-corner-all").addClass(c).append(g);
this.options.readOnly?e.addClass("tagit-choice-read-only"):(e.addClass("tagit-choice-editable"),c=b("<span></span>").addClass("ui-icon ui-icon-close"),c=b('<a><span class="text-icon">\u00d7</span></a>').addClass("tagit-close").append(c).click(function(a){f.removeTag(e)}),e.append(c));this.options.singleField||(g=g.html(),e.append('<input type="hidden" value="'+g+'" name="'+this.options.fieldName+'" class="tagit-hidden-field" />'));!1!==this._trigger("beforeTagAdded",null,{tag:e,tagLabel:this.tagLabel(e),
duringInitialization:d})&&(this.options.singleField&&(g=this.assignedTags(),g.push(a),this._updateSingleTagsField(g)),this._trigger("onTagAdded",null,e),this.tagInput.val(""),this.tagInput.parent().before(e),this._trigger("afterTagAdded",null,{tag:e,tagLabel:this.tagLabel(e),duringInitialization:d}),this.options.showAutocompleteOnFocus&&!d&&setTimeout(function(){f._showAutocomplete()},0))},removeTag:function(a,c){c="undefined"===typeof c?this.options.animate:c;a=b(a);this._trigger("onTagRemoved",
null,a);if(!1!==this._trigger("beforeTagRemoved",null,{tag:a,tagLabel:this.tagLabel(a)})){if(this.options.singleField){var d=this.assignedTags(),f=this.tagLabel(a),d=b.grep(d,function(a){return a!=f});this._updateSingleTagsField(d)}if(c){a.addClass("removed");var d=this._effectExists("blind")?["blind",{direction:"horizontal"},"fast"]:["fast"],g=this;d.push(function(){a.remove();g._trigger("afterTagRemoved",null,{tag:a,tagLabel:g.tagLabel(a)})});a.fadeOut("fast").hide.apply(a,d).dequeue()}else a.remove(),
this._trigger("afterTagRemoved",null,{tag:a,tagLabel:this.tagLabel(a)})}},removeTagByLabel:function(a,b){var d=this._findTagByLabel(a);if(!d)throw"No such tag exists with the name '"+a+"'";this.removeTag(d,b)},removeAll:function(){var a=this;this._tags().each(function(b,d){a.removeTag(d,!1)})}})})(jQuery);
