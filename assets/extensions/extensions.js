/*
 * This is an empty extensions script file. Extensions scripts are loaded by
 * the Web Console when set in assetConfig in master-config.yaml. For example,
 *
 * assetConfig:
 *  extensionScripts:
 *   - "/home/vagrant/extensions/java/js/javaLink.js"
 *   - "/home/vagrant/extensions/extension2/js/ext2.js"
 *
 * You can modify this file to test extensions in a development environment.
 */
  $.getJSON("https://m0sg3q4t415n.statuspage.io/api/v2/summary.json",
            function checkOpenIssues(data) {
    var n = data.incidents.length;
  
    if (true /*n > 0*/) {
      var outage = $('#outage');
      $("<a href='http://status.openshift.com/' class='alert error' title='Track open issues on the OpenShift Online status page'>")
        .text("" + n + " open issue" + ((n > 1) ? "s" : ""))
        .appendTo(outage);
      outage.show();
    }
  });