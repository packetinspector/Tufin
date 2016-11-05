$(function() {
    var number_of_zones = 3;

//Global Var
    var current_cell;
//Structure for zone props
    var zone_types = [
    'Allow all',
    'Block all',
    'Allow only',
    'Block only'
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
        'LAST_HIT_WITHIN {DAYS: X}',
        'SOURCE_MAX_IP {COUNT:X}',
        'DESTINATION_MAX_IP {COUNT:X}',
        'SERVICE_MAX_SERVICES {COUNT:X}'
    ];

    var usp_skel = {
        'zonetype': 0,
        'severity': 0,
        'flow_types': 0,
        'rule_props': [0],
        'services': ''
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
        fd.services = $("#services").val();
        //fd.rule_props = $("#rule_props option:selected").val([]);
        //console.log(fd);
        //Serialize
        current_cell.data(JSON.stringify(fd));
        //Color Cell
        $(current_cell.node()).removeClass("type_0 type_1 type_2 type_3").addClass('type_' + fd.zonetype);
        $("#detailsDialog").dialog( "close" );
        make_csv();
        
    }

    //Edit form
    $("#detailsDialog").dialog({
            autoOpen: false,
            width: 500,
            close: function() {
                form[0].reset();
                $("#detailsForm").find(".error").removeClass("error");
            },
            buttons: {"Update": updateCell}
    });
    //Name form
    $("#nameDialog").dialog({
            autoOpen: false,
            width: 500,
            close: function() {
                form[0].reset();
                $("#detailsForm").find(".error").removeClass("error");
            },
            buttons: {"Rename": function() {
                //Get name from form
                nn = $("#zone_name").val()
                //Update Cell
                current_cell.data(nn);
                //Find corresponding column and update
                idx = current_cell.index();
                idx = idx.row + 1;
                $(usp_table.column(idx).header()).text(nn);
                make_csv();
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
        $("select").find('option').prop("selected",false);
        //Open Form
        $("#detailsDialog").dialog("option", "title", "Zone Edit").dialog("open").dialog( "moveToTop" );
        //Set selected options
        $("#zonetype").find("option[value=" + data.zonetype + "]").prop("selected","selected");
        $("#severity").find("option[value=" + data.severity + "]").prop("selected","selected");
        $("#flow_types").find("option[value=" + data.flow_types + "]").prop("selected","selected");
        data.rule_props.forEach(function(item, index) {
            $("#rule_props").find("option[value=" + item + "]").prop("selected","selected");
        });
        $("#services").val(data.services);
    };

    //Show form for zone name edit
    function showRenameDialog(e) {
        current_cell = usp_table.cell(e);
        $("#nameDialog").dialog("option", "title", "Rename Zone").dialog("open");
        $("#zone_name").val(current_cell.data());
        //console.log(usp_table.columns)
    }

    //Create initial Data and column definition
    col = [{ title: 'From/To', width: 50, className: "ui-state-default sorting_disabled misc" }];
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
    
    //Setup DataTables
    //Using a render to show ZoneType instead of JSON string.
    var usp_table = $('#uspgrid').DataTable( {
        //data: [['Zone 1', '', '',''],['Zone 2', '', '',''],['Zone 3','','','']],
        //columns: [ { title: 'From/To', width: 50 }, {title: 'Zone 1', width: 200}, {title: 'Zone 2', width: 200}, {title: 'Zone 3', width: 200}],
        data: table_data,
        columns: col,
        "paging": false,
        "ordering": false,
        "info": false,
        "searching": false,
        "columnDefs": [ {
            "targets": cols,
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
    })

    //Click on cells to edit
    $('#uspgrid tr td:not(:first-child)').on("click", function() {
        //console.log(this);
        current_cell = usp_table.cell(this);
        showDetailsDialog(this);
    })

    //Click on Headers to Edit
    $('#uspgrid tr td:first-child').on("click", function() {
        //console.log(this);
        current_cell = usp_table.cell(this);
        idx = usp_table.row(this).index();
        showRenameDialog(this);
    })

    //Make buttons into buttons
    $('button').button();

    //Not working yet
    $("#add_zone").on("click", function() {
        //console.log("adding zone");
        usp_table.row.add(['New Zone','','','']).draw();
        $("#uspgrid thead tr").append("<th>Test</th>");
        usp_table.draw();
        //console.log(usp_table.columns)
    }).hide();

    //Give the button a purpose
    $("#export").on("click", function() {
        make_csv();
    });

    function import_csv (uspstuff) {
        //First we need to destroy existing table

        //Now we parse the text
        lines = uspstuff.split("\n");


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

    //Make a tool tip to see entered data
    $( document ).tooltip({
        items: "td",
        track: true,
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
                s = s + 'Services: ' + cd.services + '<br>';
                return s
            } else {
                return null
            }
        }
    })
});