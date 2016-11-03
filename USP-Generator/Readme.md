USP Generator
================

Available in hosted form via CodePen: http://codepen.io/packetinspector/full/PbYpXL/

Note you can edit this in codepen too, just choose the editor view:

http://codepen.io/packetinspector/pen/PbYpXL

This is all client side JS. No server neeed to run.  
You can drag the index.html to your browser or simply use the hosted version.

To change the number of zones edit the variable at the top of the JS:
```javascript
var number_of_zones = 3;
```

Features to add
- Import Zone Names
- Import existing USP to edit
- Better input of services
- Validate Service list
- Add/Remove Zones dynamically

If you like containers you could host this easily if needed

```shell
docker run --name usp-nginx2 -v <full_local_path_to_html>:/usr/share/nginx/html:ro -d -p 8080:80 nginx
```

If you're on-site with no internet access, you can use FF's offline mode to use the app.
Before you lose access, load the html and then choose work offline.  It will cache the JS from the internet.