const SS = document.getElementById("sendStatus"); // This was more relavent when sendFunc was 3 seperate funcs

/*
This function will check if the sending status is already what the pressed button was
If it is not the same, it will fetch from the path, thus calling the corresponing function
*/
function sendFunc(checkText, path){
    if(SS.textContent == checkText){
        return;
    }
    const resp = fetch(path);
}

/* I am not sure if i need This
This function just reloads the table when the page reloads
*/
window.addEventListener("DOMContentLoaded", () => {
    if (fileCache.length) {
        renderTable();
    } else {
        loadFiles();
    }
});

/*
This function only deletes the selected file
*/
async function deleteFile(){
  const resp = await fetch("/deleteFile");
  loadFiles();
}

/*
The loadFiles function gets a list of files in JSON form from the ESP32
It then saves it to the fileCache and calls renderTable

The renderTable function populates the file table with the files in the fileCache
*/

let fileCache = [];

function loadFiles(){
  fetch("/listFiles")
    .then(r => r.json())
    .then(files => {
      fileCache = files;   // save data
      renderTable();
    });
}

function renderTable() {
    const tbody = document.querySelector("#fileTable tbody");
    tbody.innerHTML = "";

    fileCache.forEach(f => {  
        const row = document.createElement("tr");

        const radioCell = document.createElement("td");
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "rowSelect";
        //radio.addEventListener("change", () => rowClicked(row));
        
        radioCell.appendChild(radio);
        row.appendChild(radioCell);
        
        row.innerHTML += `            
            <td>${f.name}</td>
            <td>${f.size}</td>
            <td>${new Date(f.time * 1000).toLocaleString()}</td>
        `;
        row.children[0].addEventListener("change", () => rowClicked(row));
        //row.addEventListener("click", () => rowClicked(row));
        
        tbody.appendChild(row);
    });
}   
/*
This function sends a post request to the ESP32 which contains the filename of the selected row
This filename is then used by the ESP when drip feeding begins
*/
function rowClicked(row){
    const filename = row.children[1].textContent;
    
    fetch("/selectFile", {
        method: "POST",
        body: filename
    });
}

/*
The newMessage function allows the ESP32 to send messages to the Messages text area
The text area basically serves as a debug window for updates and shit

The newStatus function allows the ESP32 to update the send status async
*/
const ES = new EventSource("/events");

ES.addEventListener("newMessage", e => {
    const TA = document.getElementById("messageBox");
    TA.value = e.data + "\n" + TA.value;
});

ES.addEventListener("newStatus", e => {
    const SS = document.getElementById("sendStatus");
    SS.textContent = e.data;
});

// This is used as a way for the ESP to force the site to reload the file table
ES.addEventListener("reloadFiles", e => {
  loadFiles();
});

// This is used to update the percent complete
ES.addEventListener("newPercent", e => {
  const SP = document.getElementById("percentSent");
  SP.textContent = e.data;
});

/*
This is a bit of an experiment
This should send the uploaded file over HTTP_POST to the ESP32 SD card
*/
function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return;

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  fetch("/upload", {
    method: "POST",
    body: formData
  })
  .then(r => r.text())
  .then(t => {
  });
  //.catch(e => document.getElementById("status").innerText = "Error");
}


/*
This function sends a JSON file to the ESP
The file contains the serial params which the ESP will then set
*/
function setParams() {
  const params = {
    BR: document.getElementById("baudRate").value,
    DB: document.getElementById("dataBits").value,
    PA: document.getElementById("parity").value,
    SB: document.getElementById("stopBits").value,
    FC: document.getElementById("flowControl").value
  };
  
  fetch("/setParams", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(params)
  });
  
  console.log(JSON.stringify(params));
}

/*
This function fetches the current RS232 parameters from the ESP and updates the table accordingly
*/
function getParams() {
  fetch("/getParams")
    .then(r => r.json())
    .then(params => {
      document.getElementById("baudRate").value = params.BR;
      document.getElementById("dataBits").value = params.DB;
      document.getElementById("parity").value = params.PA;
      document.getElementById("stopBits").value = params.SB;
      document.getElementById("flowControl").value = params.FC;
    });
}
