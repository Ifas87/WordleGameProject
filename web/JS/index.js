/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

console.log("Started");

$("#hostForm").submit(function(e) {
    sessionStorage.setItem('hostUsername', document.getElementById("hostID").value);
    sessionStorage.setItem('gameID', document.getElementById("hostGameID").value);
    
    var form = $(this); // referring to the form
    console.log(form.serialize());
    e.preventDefault();
    
    var actionUrl = form.attr('action');
    const prefix = "task=host&";
    
    $.ajax({
        type: "POST",
        url: actionUrl,
        data: (prefix+form.serialize()), // serializes the form's elements.
        success: function(data)
        {
            console.log(data);
            window.location.replace(data);
        }
    });
});

$("#joinForm").submit(function(e) {
    sessionStorage.setItem('username', document.getElementById("guestID").value);
    sessionStorage.setItem('gameID', document.getElementById("joinGameID").value);
    
    var form = $(this); // referring to the form
    console.log(form.serialize());
    e.preventDefault();
    
    var actionUrl = form.attr('action');
    const prefix = "task=join&";
    
    $.ajax({
        type: "POST",
        url: actionUrl,
        data: (prefix+form.serialize()), // serializes the form's elements.
        success: function(data)
        {
            console.log(data);
            window.location.replace(data);
        }
    }); 
});