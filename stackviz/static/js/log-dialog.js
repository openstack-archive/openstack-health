
"use strict";


function addDialogButton(parentID) {
    //parentID: A string contiaining the parent div id to which the button will be appended
    var button = $('<button/>',
    {
        text: 'View Log',
        click: function() {$("#details-dialog").dialog("open");}
    });

    $(parentID).append(button);

    $("#details-dialog").dialog({
      dialogClass: 'ui-dialog',
      autoOpen: false,
      width: 800,
      height: 500,
      buttons: [
        {
          text: "OK",
          click: function() {
            $( this ).dialog( "close" );
          }
        }
      ]

    });

}
