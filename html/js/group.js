(function ($) {
  var authToken;
  Wild.authToken
    .then(function setAuthToken(token) {
      if (token) {
        authToken = token;
      } else {
        window.location.href = "/index.html";
      }
    })
    .catch(function handleTokenError(error) {
      alert(error);
      window.location.href = "/index.html";
    });

  // Register click handler for #request button
  $(function onDocReady() {
    $("#signOut").click(function () {
      Wild.signOut();
      //alert("You have been signed out.");
      window.location = "signin.html";
    });
  });

  $(document).ajaxError(function (event, xhr, settings, error) {
    //when there is an AJAX request and the user is not authenticated -> redirect to the login page
    if (xhr.status == 401) {
      // 401 - Forbidden
      window.location = "signin.html";
    }
  });

  $(function () {
    var $end_date = $("#end_date");
    var $item_name = $("#item_name");
    var $item_type = $("#item_type");
    var $item_info = $("#item_info");
    var $item = $("#item");
    var $notify_date = $("#notify_date");

    var fileformdata = new FormData();
    var fileuploadurl;
    var filename;
 
    $("#file-input").change(function (e) {
      var file_name = e.target.files[0].name;

      $.ajax({
        method: "POST",
        url: _config.api.invokeUrl + "/item/upload/" + file_name,
        crossDomain: true,
        dataType: "json",
        headers: {
              Authorization: authToken
          },
        data: JSON.stringify(items),
        contentType: "application/json",
        success: function (response) {
          //console.log(response);

          fileformdata.append("key", response.fields.key);
          fileformdata.append("AWSAccessKeyId", response.fields.AWSAccessKeyId);
          fileformdata.append("policy", response.fields.policy);
          fileformdata.append("signature", response.fields.signature);
          fileformdata.append("file", e.target.files[0]);
          fileuploadurl = response.url;
          filename = response.item + '_' + e.target.files[0].name;
        },
        error: function (request, status, error) {
          alert(request.responseText);
        },
      });
    });




    $(document).on("click", "#download-icon", function (e) {

    $.ajax({
          method: 'POST',
          url: _config.api.invokeUrl + '/item/download/'+ $(this).attr("data-id"),
          crossDomain: true,
          dataType: 'json',
          headers: {
                Authorization: authToken
            },
          contentType: 'application/json',
          success: function (response){
              // alert(response)
              document.getElementById("download-size").innerHTML = response.filename + " with size " + ((response.filesize/1024)/1024).toFixed(4) + " MB" ;
              document.getElementById("download-button").href = response.signedurl
              document.getElementById("item-to-copy").href = response.signedurl
             
          },
          error: function (request, status, error) {
            alert(request.responseText);

          }
         
        });
      });
 

      $(document).on("click", ".download", function (e) {
  
        document.querySelector("#download-button").dataset.id = $(this).attr(
          "data-id"
        );
      });

    //$('#add-button').on('click', function () {
    $(document).on("click", "#add-button", function (e) {
      var items = {
        item_name: $item_name.val(),
        item_info: $item_info.val() || " ",
        item_type: $item_type.val(),
        item: $item.val(),
        end_date: $end_date.val(),
        notify_date: $notify_date.val(),
        filename: filename
      };

      var urlParams = new URLSearchParams(window.location.search);
        const group_email = urlParams.get('group_email')
         // console.log(group_email)
      $.ajax({
        method: "POST",
        url: _config.api.invokeUrl + "/group/" + group_email,
        crossDomain: true,
        dataType: "json",
        headers: {
          Authorization: authToken,
        },
        data: JSON.stringify(items),
        contentType: "application/json",
        success: function () {
          //     console.log(items);
        if  ( filename ) {
          $.ajax({
            method: "POST",
            url: fileuploadurl,
            crossDomain: true,
            processData: false,
            contentType: false,
            async: false,
            cache: false,
            timeout: 30000,
            data: fileformdata,
            enctype: "multipart/form-data",

            success: function (response) {
              //console.log(response);
              //alert(filename);
              location.reload();
              
            },
            error: function (request, status, error) {
              alert(request.responseText);
            },
          });
          
         } 
         
         location.reload();

        
        },
        error: function (request, status, error) {
          alert(request.responseText);
        },
      });
    });
    
    $(document).on("click", "#dropdown-item-choose", function () {

      window.location.href = 'group.html?group_email=' + $(this).attr('data-id');
     
   //   console.log($(this).attr('data-id'))
     })


     $(function onDocReady() {
     
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('group_email'))   {
        const group_email = urlParams.get('group_email')
        $('#add-new-item').show()
        $('#delete-group-and-item').show()
        $('#exporttable').show()
        $('#permission-new-item').show()
       // console.log(group_email)
      var gozeit_data = "";

     $.ajax({
      type: "GET",
      url: _config.api.invokeUrl + "/group/" + group_email,
      crossDomain: true,
      dataType: "json",
      headers: {
        Authorization: authToken,
      },
      contentType: "application/json",
      success: function (response) {
             // console.log(response);

              $.each(response.Items, function (i, item) {

                document.getElementById("group-name").innerHTML = response.group_name + ' Group' + '<a href="#EditGroup" data-id=' +  '"' + response.group_name +'"'  + ' class="editgroupname"  data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a> '
                document.getElementById("group-created").innerHTML =  "Created by " + response.group_creator + ' at '+ (response.created.slice(11,16)).replace("-",":") + ' ' + response.created.slice(0,10) 
                if (typeof response.updated != "undefined")  {
                  document.getElementById("group-updated").innerHTML =  "Group Name Updated " + (response.updated.slice(11,16)).replace("-",":") + ' ' + response.updated.slice(0,10)
                }
                if (response.group_admin.length !==0) {

                  document.getElementById("group-admin").innerHTML = 'Group Admins ' + response.group_admin

                }

                if (response.group_member.length !==0) {

                  document.getElementById("group-member").innerHTML = 'Group Members ' + response.group_member


                }
                

                
                
                 
                
              
                  //console.log(response.group_admin);

                 // console.log(response.created);
                  $.each(response.Items.Items, function (i, item) {

                  //console.log(response.Items.Items[i]);
                  
                  gozeit_data += `<tr>
                  <td>
                
                  </td>`;
                gozeit_data +=
                  `<td class="clsname" data-id="${response.Items.Items[i].item}-item_name">` +
                  response.Items.Items[i].item_name +
                
                  "</td>";
                  gozeit_data +=
                  `<td class="clsname" data-id="${response.Items.Items[i].item}-item_info">` +
                  response.Items.Items[i].item_info +
                
                  "</td>";
                  gozeit_data +=
                  `<td class="clsname" data-id="${response.Items.Items[i].item}-item_type">` +
                  response.Items.Items[i].item_type +
                
                  "</td>";
                  gozeit_data +=
                  `<td class="clsname" data-id="${response.Items.Items[i].item}-notify_date">` +
                  response.Items.Items[i].notify_date +
                
                  "</td>";
                  gozeit_data +=
                  `<td class="clsname" data-id="${response.Items.Items[i].item}-end_date">` +
                  response.Items.Items[i].end_date +
                
                  "</td>";
                  gozeit_data +=
                  `<td class="clsname" data-id="${response.Items.Items[i].item}">` +
                  response.Items.Items[i].creator +
                
                  "</td>";
                  gozeit_data +=
                  `<td class="clsname" data-id="${response.Items.Items[i].item}">` +
                  (response.Items.Items[i].item.slice(11,16)).replace("-",":") + ' ' + response.Items.Items[i].item.slice(0,10) +
                   
                  "</td>";

                  gozeit_data += `<td>
             <a href="#editItemModal" class="edit" data-id="${response.Items.Items[i].item}" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>
             <a href="#deleteItemModal" class="delete" data-id="${response.Items.Items[i].item}" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i></a>
             `
                  gozeit_data += "</tr>";

                  })
                   $("#myTable").append(gozeit_data);
               });
              

            },
      
      
    });
  }
  })

  
  $(document).on("click", ".editgroupname", function () {  

    $("#edit_group_name").val($(this).attr('data-id'));

  });
 
  $(document).on("click", "#edit-group-button", function (e) {
    var items = {
      group_name: $("#edit_group_name").val()
    };

    var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('group_email'))   {
        const group_email = urlParams.get('group_email')

    $.ajax({
      type: "PUT",
      url: _config.api.invokeUrl + "/group/" + group_email,
      crossDomain: true,
      dataType: "json",
      headers: {
        Authorization: authToken,
      },
      data: JSON.stringify(items),
      contentType: "application/json",
      success: function () {
        //   console.log(items);
        location.reload();
      },
      error: function (request, status, error) {
        alert(request.responseText);
      },
    });
   }
  });

  $(document).on("click", "#add-permission-button", function (e) {
    var items = {
      member: $("#member_name").val(),
      request: $("#permission_request").val()
     
    };

    var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('group_email'))   {
        const group_email = urlParams.get('group_email')

    $.ajax({
      type: "POST",
      url: _config.api.invokeUrl + "/group/account/" + group_email,
      crossDomain: true,
      dataType: "json",
      headers: {
        Authorization: authToken,
      },
      data: JSON.stringify(items),
      contentType: "application/json",
      success: function (response) {
       
        location.reload();
      },
     
    error: function (request, status, error) {
      alert(request.responseText);
    },
    });
  }
  });

    $(document).ready(function (data) {

      $.ajax({
        url: _config.api.invokeUrl + "/groups",
        crossDomain: true,
        dataType: "json",
        headers: {
          Authorization: authToken,
        },
        contentType: "application/json",
        success: function (data) {
            

         $.each(data.Items.group_creator, function (i, item) {

            //console.log(data.Items.group_creator[i])

             $.ajax({
              type: "GET",
              url: _config.api.invokeUrl + "/group/" + data.Items.group_creator[i],
              crossDomain: true,
              dataType: "json",
              headers: {
                Authorization: authToken,
              },
              contentType: "application/json",
              success: function (response) {
               //       console.log(response.group_name);
              //        console.log(response.group_creator);
                      let dropdown = $('#created-locality-dropdown');
                      dropdown.append($('<a' + ' ' + `data-id=${data.Items.group_creator[i]}` + ' ' + 'class="dropdown-item" id="dropdown-item-choose"></a>').attr('value', response.group_name).text(response.group_name));

              },
            });
                  
         });
         

         $.each(data.Items.group_admin, function (i, item) {

          //console.log(data.Items.group_admin[i])

           $.ajax({
            type: "GET",
            url: _config.api.invokeUrl + "/group/" + data.Items.group_admin[i],
            crossDomain: true,
            dataType: "json",
            headers: {
              Authorization: authToken,
            },
            contentType: "application/json",
            success: function (response) {
            //        console.log(response.group_name);
            //        console.log(response.group_admin);
                    let dropdown = $('#admin-locality-dropdown');
                    dropdown.append($('<a' + ' ' + `data-id=${data.Items.group_admin[i]}` + ' ' + 'class="dropdown-item" id="dropdown-item-choose"></a>').attr('value', response.group_name).text(response.group_name));

            },
          });
                
       });

       $.each(data.Items.group_member, function (i, item) {

        //console.log(data.Items.group_member[i])

         $.ajax({
          type: "GET",
          url: _config.api.invokeUrl + "/group/" + data.Items.group_member[i],
          crossDomain: true,
          dataType: "json",
          headers: {
            Authorization: authToken,
          },
          contentType: "application/json",
          success: function (response) {
              //    console.log(response.group_name);
                  //console.log(response.group_member);
                  let dropdown = $('#member-locality-dropdown');
                  dropdown.append($('<a' + ' ' + `data-id=${data.Items.group_member[i]}` + ' ' + 'class="dropdown-item" id="dropdown-item-choose"></a>').attr('value', response.group_name).text(response.group_name));
                   
          },
        });
              
     });
      

        },
        error: function (xhr, textStatus, error) {
         // console.log(xhr.responseText, items);
        },
      });
    });

    $(document).on("click", "#add-group-button", function (e) {
      var items = {
        group_name: $("#group_name").val()
       
      };

      $.ajax({
        type: "POST",
        url: _config.api.invokeUrl + "/group",
        crossDomain: true,
        dataType: "json",
        headers: {
          Authorization: authToken,
        },
        data: JSON.stringify(items),
        contentType: "application/json",
        success: function (response) {
         
          location.reload();
        },
        error: function (request, status, error) {
          alert(request.responseText);
        },
      });
    });

    $(document).on("click", "#delete-group-button", function(e) {
      //  $('.delete').on('click', function (e) {  
         // console.log(e);
          
        //  var id = $(e).attr("data-id");
      //  alert($(this).attr("data-id"));
      var urlParams = new URLSearchParams(window.location.search);
     
        const group_email = urlParams.get('group_email')
       
        $('#delete-group-and-item').show()
      
          $.ajax({
            type: 'DELETE',
            url: _config.api.invokeUrl + '/group/' + group_email,
            crossDomain: true,
            dataType: 'json',
            headers: {
              Authorization: authToken
          },
            contentType: 'application/json',
            success: function (){
              //console.log(items);
              location.reload()
              
            },
            error: function (request, status, error) {
              alert(request.responseText);
            },
          });
        
        });

    $(document).on("click", "#delete-button", function (e) {
      //  $('.delete').on('click', function (e) {
      // console.log(e);

      //  var id = $(e).attr("data-id");
      //  alert($(this).attr("data-id"));
      
      var urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('group_email'))   {
        const group_email = urlParams.get('group_email')

      

      $.ajax({
        type: "DELETE",
        url: _config.api.invokeUrl + "/group/" + group_email + '/' + $(this).attr("data-id"),
        crossDomain: true,
        dataType: "json",
        headers: {
          Authorization: authToken,
        },
        contentType: "application/json",
        success: function () {
          //      console.log(items);
          location.reload();
        },
        error: function (request, status, error) {
          alert(request.responseText);
        },
      });
    }
    });
  

    $(document).on("click", ".delete", function (e) {
      //  $('.delete').on('click', function (e) {
      // console.log(e);

      //  var id = $(e).attr("data-id");
      // alert($(this).attr("data-id"));

      document.querySelector("#delete-button").dataset.id = $(this).attr(
        "data-id"
      );
    });

    $(document).on("click", ".edit", function () {
      //  console.log($(this).attr('data-id'))

      //var editname = $(this).attr('data-id')
      //var editenddate = $(this).attr('data-id')
      //var editremarks = $(this).attr('data-id')
      //var notify_date  = $(this).attr('data-id')

      var editname = $(
        `.clsname[data-id=${$(this).attr("data-id")}-item_name]`
      ).text();
      var edittype = $(
        `.clsname[data-id=${$(this).attr("data-id")}-item_type]`
      ).text();
      var editinfo = $(
        `.clsname[data-id=${$(this).attr("data-id")}-item_info]`
      ).text();
      var notify_date = $(
        `.clsname[data-id=${$(this).attr("data-id")}-notify_date]`
      ).text();
      var end_date = $(
        `.clsname[data-id=${$(this).attr("data-id")}-end_date]`
      ).text();

      $("#editname").val(editname);
      $("#edittype").val(edittype);
      $("#editenddate").val(end_date);
      $("#editinfo").val(editinfo);
      $("#editnotifydate").val(notify_date);
    });
  });

  // $('#edit-button').on('click', function () {
  $(document).on("click", "#edit-button", function (e) {
    var items = {
      item_name: $("#editname").val(),
      item_type: $("#edittype").val(),
      end_date: $("#editenddate").val(),
      item_info: $("#editinfo").val() || " ",
      notify_date: $("#editnotifydate").val(),
    };
 
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('group_email'))   {
      const group_email = urlParams.get('group_email')
     
    $.ajax({
      type: "PUT",
      url: _config.api.invokeUrl + "/group/" + group_email + '/' + $(this).attr("data-id"),
      crossDomain: true,
      dataType: "json",
      headers: {
        Authorization: authToken,
      },
      data: JSON.stringify(items),
      contentType: "application/json",
      success: function () {
        //   console.log(items);
        location.reload();
      },
      error: function (request, status, error) {
        alert(request.responseText);
      },
    });
   }
  });

  $(document).on("click", ".edit", function (e) {
    //  $('.delete').on('click', function (e) {
    //  console.log(e);

    //  var id = $(e).attr("data-id");
    // alert($(this).attr("data-id"));

    document.querySelector("#edit-button").dataset.id = $(this).attr("data-id");
   // console.log($(this).attr("data-id"))
  });
 
  $(function() {
    $("#exporttable").on('click', function() {
      var data = "";
      var tableData = [];
      var rows = $("table tr");
      rows.each(function(index, row) {
        var rowData = [];
        $(row).find("th, td").each(function(index, column) {
          rowData.push(column.innerText);
        });
        tableData.push(rowData.join(","));
      });
      data += tableData.join("\n");
      $(document.body).append('<a id="download-link" download="data.csv" href=' + URL.createObjectURL(new Blob([data], {
        type: "text/csv"
      })) + '/>');
  
  
      $('#download-link')[0].click();
      $('#download-link').remove();
    });
  });

  


  $(document).ready(function () {
    // Activate tooltip
    $('[data-toggle="tooltip"]').tooltip();

    // Select/Deselect checkboxes
    var checkbox = $('table tbody input[type="checkbox"]');
    $("#selectAll").click(function () {
      if (this.checked) {
        checkbox.each(function () {
          this.checked = true;
        });
      } else {
        checkbox.each(function () {
          this.checked = false;
        });
      }
    });
    checkbox.click(function () {
      if (!this.checked) {
        $("#selectAll").prop("checked", false);
      }
    });
  });
  
})(jQuery);


function copyToClipboard() {

  var x = document.getElementById("notify-to-copy");
  if (x.innerText !== "Link Copied") {
    x.innerHTML = "Link Copied";
    
  } else {
    x.innerHTML = "";
  }
    const str = document.getElementById('item-to-copy').href;

const el = document.createElement('textarea');
 el.value = str;
 el.setAttribute('readonly', '');
 el.style.position = 'absolute';
 el.style.left = '-9999px';
 document.body.appendChild(el);
 el.select();
 document.execCommand('copy');
 document.body.removeChild(el);
 location.reload();
}

function mySearchFunction() {
  var input, filter, table, tr, td, i, txtValue;
  input = document.getElementById("myInput");
  filter = input.value.toUpperCase();
  table = document.getElementById("myTable");
  tr = table.getElementsByTagName("tr");
  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[0];
    if (td) {
      txtValue = td.textContent || td.innerText;
      if (txtValue.toUpperCase().indexOf(filter) > -1) {
        tr[i].style.display = "";
      } else {
        tr[i].style.display = "none";
      }
    }       
  }
}

 