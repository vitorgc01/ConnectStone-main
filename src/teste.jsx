import { useState } from "react";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";

// Inicialize o Firebase App
const firebaseConfig = {
  apiKey: "AIzaSyAwO6cw2H6HFl9fR_Yr6iRkBGkSQHX7cXY",
  authDomain: "granito-app.firebaseapp.com",
  projectId: "granito-app",
  storageBucket: "granito-app.appspot.com",
  messagingSenderId: "173250363454",
  appId: "1:173250363454:web:4a99ac509fda34130a116f",
  measurementId: "G-C4ZGM73BX6"
};

export default function UploadTeste() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");

  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo");

    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `rochas/${fileName}`);

    try {
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      setUrl(downloadURL);
      alert("Upload concluído!");
    } catch (e) {
      console.error("Erro ao fazer upload:", e);
    }
  };

  return (
    <div>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload}>Upload</button>
      {url && (
        <p>
          URL: <a href={url}>{url}</a>
        </p>
      )}
    </div>
  );
}