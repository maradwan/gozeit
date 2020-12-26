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
    if (xhr.status == 403 || xhr.status == 401) {
      // 403 - Forbidden
      window.location = "signin.html";
    }
  });

  $(function () {
    var $enddate = $("#enddate");
    var $itemname = $("#itemname");
    var $typename = $("#typename");
    var $remarks = $("#remarks");
    var $item = $("#item");
    var $notifydate = $("#notifydate");

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
        itemname: $itemname.val(),
        typename: $typename.val(),
        end_date: $enddate.val(),
        item: $item.val(),
        remarks: $remarks.val() || " ",
        notify_date: $notifydate.val(),
        filename: filename
      };

      $.ajax({
        method: "POST",
        url: _config.api.invokeUrl + "/item",
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
  
    $(document).ready(function (data) {
      var gozeit_data = "";

      $.ajax({
        url: _config.api.invokeUrl + "/item",
        crossDomain: true,
        dataType: "json",
        headers: {
          Authorization: authToken,
        },
        contentType: "application/json",
        success: function (data) {
          //  console.log(data.Items)

          $.each(data.Items, function (i, item) {
            gozeit_data += `<tr>
              <td>
            
              </td>`;
            gozeit_data +=
              `<td class="clsname" data-id="${data.Items[i].item}-itemname">` +
              data.Items[i].itemname +
              "</td>";
            gozeit_data +=
              `<td class="clsname" data-id="${data.Items[i].item}-typename">` +
              data.Items[i].typename +
              "</td>";
            gozeit_data +=
              `<td class="clsname" data-id="${data.Items[i].item}-notify_date">` +
              data.Items[i].notify_date +
              "</td>";
            gozeit_data +=
              `<td class="clsname" data-id="${data.Items[i].item}-end_date">` +
              data.Items[i].end_date +
              "</td>";
            gozeit_data +=
              `<td class="clsname" data-id="${data.Items[i].item}-remarks">` +
              data.Items[i].remarks +
              "</td>";
            // gozeit_data += '<td>'+data.Items[i].item+'</td>';
            gozeit_data += `<td>
             <a href="#editItemModal" class="edit" data-id="${data.Items[i].item}" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>
             <a href="#deleteItemModal" class="delete" data-id="${data.Items[i].item}" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i></a>
             `
             if (data.Items[i].filename) {
              gozeit_data += `
              <a href="#downloadItemModal" id="download-icon" class="download" data-id="${data.Items[i].item}" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="${data.Items[i].filename}">&#128206;</i></a>
              </td>`;
             }
            gozeit_data += "</tr>";
          });

          $("#myTable").append(gozeit_data);
        },
        error: function (xhr, textStatus, error) {
         // console.log(xhr.responseText, items);
        },
      });
    });

    $(document).on("click", "#delete-button", function (e) {
      //  $('.delete').on('click', function (e) {
      // console.log(e);

      //  var id = $(e).attr("data-id");
      //  alert($(this).attr("data-id"));

      $.ajax({
        type: "DELETE",
        url: _config.api.invokeUrl + "/item/" + $(this).attr("data-id"),
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
      });
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
        `.clsname[data-id=${$(this).attr("data-id")}-itemname]`
      ).text();
      var edittype = $(
        `.clsname[data-id=${$(this).attr("data-id")}-typename]`
      ).text();
      var remarks = $(
        `.clsname[data-id=${$(this).attr("data-id")}-remarks]`
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
      $("#editremarks").val(remarks);
      $("#editnotifydate").val(notify_date);
    });
  });


  
  // $('#edit-button').on('click', function () {
  $(document).on("click", "#edit-button", function (e) {
    var items = {
      itemname: $("#editname").val(),
      typename: $("#edittype").val(),
      end_date: $("#editenddate").val(),
      remarks: $("#editremarks").val() || " ",
      notify_date: $("#editnotifydate").val(),
    };

    $.ajax({
      type: "PUT",
      url: _config.api.invokeUrl + "/item/" + $(this).attr("data-id"),
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
  });

  $(document).on("click", ".edit", function (e) {
    //  $('.delete').on('click', function (e) {
    //  console.log(e);

    //  var id = $(e).attr("data-id");
    // alert($(this).attr("data-id"));

    document.querySelector("#edit-button").dataset.id = $(this).attr("data-id");
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
    td = tr[i].getElementsByTagName("td")[1];
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

 