

(function ($) {
    var authToken;
    Wild.authToken.then(function setAuthToken(token) {
        if (token) {
            authToken = token;
        } else {
            window.location.href = '/index.html';
        }
    }).catch(function handleTokenError(error) {
        alert(error);
        window.location.href = '/index.html';
    });

	     
    // Register click handler for #request button
    $(function onDocReady() {
        $('#signOut').click(function() {
            Wild.signOut();
            //alert("You have been signed out.");
            window.location = "signin.html";
        });
        
    });

    $(document).ajaxError(function (event, xhr, settings, error) {
      //when there is an AJAX request and the user is not authenticated -> redirect to the login page
      if (xhr.status == 403 || xhr.status == 401) { // 403 - Forbidden
          window.location = 'signin.html';
      }
  });

    $(function () {

     
  
     //$('#add-button').on('click', function () {
      $(document).on("click", "#add-button", function(e) {
      
      var items = {
     
      
     };
   
    $.ajax({
          method: 'POST',
          url: _config.api.invokeUrl + '/item',
          crossDomain: true,
          dataType: 'json',
          headers: {
                Authorization: authToken
            },
          data: JSON.stringify(items),
          contentType: 'application/json',
          success: function (){
       //     console.log(items);
            location.reload()
  
          },
          error: function (request, status, error) {
            alert(request.responseText);

          }
         
        });
  
      });
  

    $(document).ready(function(data){
       var gozeit_data = "";


        $.ajax({
          url: _config.api.invokeUrl + '/account',
          crossDomain: true,
          dataType: 'json',
          headers: {
            Authorization: authToken
         },
          contentType: 'application/json',
          success: function (data){
                   //console.log(data[0]['email']),
                   //console.log(data[0]['item'])
                  
                  var payment_form = document.createElement('form')
                  payment_form.id =  "payment_form"
                  //payment_form.action =  _config.api.invokeUrl + "/charge/standard"
                  //payment_form.method =  "post"
                
                  $('#payment_wrapper').append(payment_form)

                  $('#payment_form').submit(function(event) {
                    event.preventDefault()

                    $.ajax({
                      method: 'POST',
                      url: _config.api.invokeUrl + '/charge/standard',
                      crossDomain: true,
                      dataType: 'json',
                      headers: {
                        Authorization: authToken
                     },
                     data: JSON.stringify(FormData),
                      contentType: 'application/json',
                      success: function (data){


                  }
                })
              })


                  var payment_script = document.createElement('script')
                   payment_script.src="https://checkout.stripe.com/checkout.js"
                   payment_script.className="stripe-button"
                   payment_script.dataset.email=data[0]['email']
                   payment_script.dataset.key="pk_test_51H2yAJA6VGF012iUSn8n2toZcvQ2ghWpzf78BBeFPQz0P6z1r1tEUXQZSXoWQDVHBWSoFfvgp53ZUUqSEeLbjUbw00287yTWFA"
                   payment_script.dataset.description="Yearly Standard"
                   payment_script.dataset.amount="200"
                   payment_script.dataset.locale="auto"
                   
                   $('#payment_form').append(payment_script)
                   
                   
               
                   
          
                
  
            $.each(data, function(){
            
              gozeit_data += `<tr>
              <td>
            
              </td>`
              gozeit_data += '<td>Account Type</td>';
              if (typeof data[0]['account_type'] != "undefined") {
              gozeit_data += '<td>'+data[0]['account_type']+'</td>';
              }

              else {

                gozeit_data += '<td>'+'Free-Basic'+'</td>';

              }
              gozeit_data += `<tr>
              <td>`

              gozeit_data += '<td>Records Limit</td>';
              gozeit_data += '<td>'+data[0]['item_limit']+'</td>';
              gozeit_data += `<tr>
              <td>`

              gozeit_data += '<td>File Upload Limit</td>';
              if (typeof data[0]['limit_filesize'] != "undefined") {

              gozeit_data += '<td>'+((data[0]['limit_filesize']/ 1024)/1024).toFixed(1) + ' MB'+'</td>'
              }
              else {
                gozeit_data += '<td>'+'1 MB'+'</td>';
              }
              gozeit_data += `<tr>
              <td>`
             
              gozeit_data += '<td>Email</td>';
              gozeit_data += '<td>Enabled by Default to '+ data[0]['email']+'</td>';
              
              gozeit_data += `<tr>
              <td>`

              gozeit_data += '<td>Group Created</td>';

              if (typeof data[0]['group_creator'] != "undefined") {
              gozeit_data += '<td>'+ (data[0]['group_creator']).length+'</td>';
              }
              else {
                gozeit_data += '<td>'+' '+'</td>';
              }

              gozeit_data += `<tr>
              <td>`

              gozeit_data += '<td>Group Admin</td>';
              if  (typeof data[0]['group_admin'] != "undefined") {
              gozeit_data += '<td>'+ (data[0]['group_admin']).length+'</td>';
              }
              else {
                gozeit_data += '<td>'+' '+'</td>';
              }
              gozeit_data += `<tr>
              <td>`

              gozeit_data += '<td>Group Member</td>';

              if  (typeof data[0]['group_member'] != "undefined") {
              gozeit_data += '<td>'+ (data[0]['group_member']).length+'</td>';
              }
              else {
                gozeit_data += '<td>'+' '+'</td>';
              }
              gozeit_data += `<tr>
              <td>`
            

              gozeit_data += '<td>Webhook</td>';

              if (typeof data[0]['webhook'] != "undefined") {

              gozeit_data += '<td>'+data[0]['webhook']+'</td>';
             
              }
              
             gozeit_data += `<td>
             <a href="#editItemModal" class="edit" data-webhook="${data[0]['webhook']}" data-webhookurl="${data[0]['webhook_url']}" data-toggle="modal"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>
             </td>`
                     
             
             gozeit_data += '</tr>';
              
             });

         $('#myTable').append(gozeit_data);

          },
          error: function(xhr, textStatus, error) {
              console.log(xhr.responseText,items);
          }
            
      });

    });
  

 
    
    $(document).on("click", "#delete-account-button", function(e) {
      //  $('.delete').on('click', function (e) {  
         // console.log(e);
          
        //  var id = $(e).attr("data-id");
      //  alert($(this).attr("data-id"));
      
          $.ajax({
            type: 'DELETE',
            url: _config.api.invokeUrl + '/account',
            crossDomain: true,
            dataType: 'json',
            headers: {
              Authorization: authToken
          },
            contentType: 'application/json',
            success: function (){
              //console.log(items);
              //location.reload(),
              Wild.signOut()
              window.location = 'signin.html';
            }
          });
        });
  
  
      $(document).on("click", ".delete", function(e) {
    //  $('.delete').on('click', function (e) {  
       // console.log(e);
        
      //  var id = $(e).attr("data-id");
     // alert($(this).attr("data-id"));
    
     document.querySelector('#delete-button').dataset.id = $(this).attr("data-id");
  
  
      });
  

          
  
      $(document).on('click', '.edit', function() {


        var editstatus = $(this).attr('data-webhook') 

        if ($(this).attr('data-webhookurl') != "undefined") {
        var webhookurl = $(this).attr('data-webhookurl')  
        }
         
       
        $('#editstatus').val(editstatus)
        $('#webhookurl').val(webhookurl) 


        })
      }) 
  
       // $('#edit-button').on('click', function () {
          $(document).on("click", "#edit-button", function(e) {
        
          var items = {
            webhook:  $('#editstatus').val() ,
            webhook_url: $('#webhookurl').val() 
          
           };
  
          
        
        $.ajax({
          type: 'PUT',
          url: _config.api.invokeUrl + '/account/webhook',
          crossDomain: true,
          dataType: 'json',
          headers: {
            Authorization: authToken
        },
          data: JSON.stringify(items),
          contentType: 'application/json',
          success: function (){
            
            location.reload()
          },
          error: function (request, status, error) {
            alert(request.responseText);

          }

          });
  
         
        });
       
        $(document).on("click", ".edit", function(e) {
        
      //  $('.delete').on('click', function (e) {  
        //  console.log(e);
          
        //  var id = $(e).attr("data-id");
       // alert($(this).attr("data-id"));
      
       document.querySelector('#edit-button').dataset.id = $(this).attr("data-id");
    
      });
    
  
  
      $(document).ready(function()
      {
       // Activate tooltip
       $('[data-toggle="tooltip"]').tooltip();
       
       // Select/Deselect checkboxes
       var checkbox = $('table tbody input[type="checkbox"]');
       $("#selectAll").click(function()
       {
        if(this.checked){
         checkbox.each(function()
         {
          this.checked = true;                        
         });
        }
        else
        {
         checkbox.each(function()
         {
          this.checked = false;                        
         });
        } 
       });
       checkbox.click(function()
       {
        if(!this.checked)
        {
         $("#selectAll").prop("checked", false);
        }
       });
      });
      


    
      

}(jQuery));



 
