function saveStationDocumentIDAndRedirect(){
    let params = new URL(window.location.href) //get the url from the search bar
    let ID = params.searchParams.get("docID");
    console.log(ID);
    localStorage.setItem('stationDocID', ID);
    window.location.href = '../incidentReport.html';
}
