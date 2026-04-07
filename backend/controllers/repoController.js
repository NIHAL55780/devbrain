import axios from "axios";

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
    try{
        const {repoUrl} = req.body;
        if(!repoUrl){
            return res.status(400).json({error:"repo url required"});
        }
        const parts = repoUrl.split("/");
        const owner = parts[3];
        const repo = parts[4];
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents`;
        const files = await fetchRepoContents(apiUrl);
        res.json({
            totalFiles:files.length,
            files,
        });
    }catch(error){
        res.status(500).json({error:"error analyzing repo"});   
    }
};