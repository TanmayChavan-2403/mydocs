<script>
    import { watchResize } from "svelte-watch-resize";
    import { element } from "svelte/internal";
    let subjects = ["Software Engineering", "Linear Algebra", "Python", "Nodejs", "Svelte", "Cpp",
    "DBMS", "Web Technologies", "MongoDb"]
    let gap = "15px";
    let folder;

    function computeSize(e){
        let containerWidth = e.clientWidth - 50;    
        let elementSize = folder.offsetWidth;
        let elements = Math.trunc(containerWidth / elementSize);
        let whiteSpace = containerWidth - (elementSize * elements);
        let gap = `${whiteSpace / elements}px`;
        e.style.gap = gap;
        e.style.paddingLeft = `${gap + 25}px`
        console.log(gap, whiteSpace, elements, elementSize)
        
    }

</script>

<div id="FolderListContainer" use:watchResize={e => computeSize(e)}>

    {#each subjects as sub}
        <div class="folder" bind:this={folder}>
            <div class="folderIcon">
                <img src="./icons/folder2.png" alt="Folder Icon">
            </div>
            <div class="folderNameContainer">
                <div class="fileCount">
                    <h4> 01 FILES </h4>
                </div>
                <div class="folderName">
                    <p> {sub} </p>
                </div>
            </div>
        </div>
    {/each}
    
</div>


<style>

    #FolderListContainer{
        width: 100%;
        height: 80%;
        display: flex;
        padding: 25px;
        flex-wrap: wrap;
        overflow: scroll;
        row-gap: 20px;
    }

    .folder{
        width: 15%;
        height: 40%;
        cursor: pointer;
        min-width: 135px;
    }

    .folder:hover{
        background-color: #d9e9ff;
    }

    .folderIcon{
        width: 100%;
        height: 55%;
        display: flex;
        align-items: center;
        justify-content: center;
        /* border: 1px solid black; */
    }

    .folderIcon img{
        height: 75%;
    }

    .folderNameContainer{
        widows: 100%;
        height: 45%;
    }

    .fileCount{
        width: 100%;
        color: rgb(151, 151, 151);
        font-weight: 900;
        text-align: center;
        font-size: 0.8rem;
    }

    .folderName{
        font-weight: 500;
        text-align: center;
    }

    @media (max-width: 750px){
        .folderIcon img{
            height: 55%;
        }
    }

</style>