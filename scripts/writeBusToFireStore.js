   const fetchJSONData = async () => {
    const response = await fetch("../transformed-bus-routes.json");
    if (!response.ok) {
      throw new Error("Failed to fetch JSON data");
    }
    return await response.json();
  };


  const uploadJSONToFirestore = async () => {
    try {
      const jsonData = await fetchJSONData();
      for (const route of jsonData) {
        const documentName = `${route.routeNumber} - ${route.routeName}`;
        await db.collection("routes").doc(documentName).set(route);
        console.log(`Document ${documentName} written successfully!`);
      }
      alert("All JSON data has been uploaded successfully!");
    } catch (error) {
      console.error("Error writing document: ", error);
      alert("An error occurred while uploading the data.");
    }
  };

  
  document.getElementById("uploadButton").addEventListener("click", uploadJSONToFirestore);
  