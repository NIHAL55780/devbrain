import axios from "axios";
import { getTopChunks } from "../services/similarityService.js";
import { getEmbeddings } from "../services/embeddingService.js";
import { generateAnswer } from "../services/llmService.js";
import { setChunks,getChunks } from "../services/store.js";


export const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    // ✅ Get stored chunks
    const chunks = getChunks();

    if (!chunks || chunks.length === 0) {
      return res.status(400).json({ error: "No repo analyzed yet" });
    }

    // 🔹 Step 1: Embed question
    const queryEmbeddingArr = await getEmbeddings([question]);
    if (!queryEmbeddingArr || queryEmbeddingArr.length === 0 || !queryEmbeddingArr[0]) {
      return res.status(502).json({ error: "Embedding service unavailable" });
    }
    const queryEmbedding = queryEmbeddingArr[0];
    console.log("Query embedding length:", queryEmbedding.length);
    // 🔹 Step 2: Retrieve
    const topChunks = getTopChunks(queryEmbedding, chunks, 5);

    // 🔹 Step 3: LLM
    const answer = await generateAnswer(question, topChunks);

    res.json({
      success: true,
      question,
      answer,
      sources: topChunks.map(c => ({
        file: c.path,
        score: c.score.toFixed(3),
        preview: c.chunk.slice(0, 120)
    }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing question" });
  }
};
const ALLOWED_EXTENSIONS = [".js",".py",".jsx",".tsx",".java",".cpp",".json",".md"];

const isValidFile = (fileName)=>{
    return ALLOWED_EXTENSIONS.some(ext=>fileName.endsWith(ext));
};

const chunkText = (text,chunkSize = 1000 , overlap = 200)=>{
    const chunks =[];
    let start = 0;
    while (start<text.length){
        const end = start + chunkSize;
        chunks.push(text.slice(start,end));
        start = start + chunkSize - overlap;    
    }
    return chunks;
};

const fetchRepoContents = async (url , allFiles = []) =>{
    try{
        const { data } = await axios.get(url,{
            headers:{
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
            },
        });
        for(const item of data){
            if(item.type === 'file' && isValidFile(item.name)){
                if(item.size >50000){
                    continue;   //avoid large files
                }
                if(item.path.startsWith(".github")){
                    continue;
                }
                console.log("FILE:", item.path);
                try{
                    const fileContent = await axios.get(item.download_url,{
                        headers:{
                            Authorization: `token ${process.env.GITHUB_TOKEN}`,
                        },
                    });
                    const chunks = chunkText(fileContent.data);
                    
                    chunks.forEach((chunk,index)=>{
                        allFiles.push({
                        name :item.name,
                        path:item.path,
                        chunk : chunk,
                        chunkIndex : index,
                        });
                    });
                    
                }catch(err){
                    console.log("Skipping file:" , item.path);
                }
                
            }
            else if (item.type === 'dir'){
                await fetchRepoContents(item.url,allFiles);
            }
        }
            return allFiles;
        }catch(error){
            console.error("error fetching repo :" , error.message);
            return allFiles;
        }
};

export const analyzeRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ error: "repo url required" });
    }

    const parts = repoUrl.split("/");
    const owner = parts[3];
    const repo = parts[4];

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;

    // 🔹 Step 1: Fetch + chunk
    const allFiles = await fetchRepoContents(apiUrl);

    console.log("Chunks before embedding:", allFiles.length);

    if (allFiles.length === 0) {
      return res.status(400).json({ error: "No valid files found" });
    }

    // 🔹 Step 2: Extract chunk texts
    const chunkTexts = allFiles.map(item => item.chunk);

    // 🔹 Step 3: Get embeddings
    const embeddings = await getEmbeddings(chunkTexts);
    if (!embeddings || embeddings.length !== chunkTexts.length || embeddings.some(e => !e)) {
      return res.status(502).json({ error: "Embedding service unavailable" });
    }
    console.log("Embeddings length:", embeddings.length);
    console.log("Sample embedding:", embeddings[0]?.slice(0, 5));
    console.log("Type of value:", typeof embeddings[0]?.[0]);

    // 🔹 Step 4: Combine
    const enrichedData = allFiles.map((item, index) => ({
      ...item,
      embedding: embeddings[index],
    }));

    // 🔥 Step 5: STORE (IMPORTANT)
    setChunks(enrichedData);

    console.log("Stored chunks:", enrichedData.length);

    res.json({
      message: "Repo analyzed successfully",
      totalChunks: enrichedData.length,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "error analyzing repo" });
  }
};

