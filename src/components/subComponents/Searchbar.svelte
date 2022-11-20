<div id="searchbar-section">
    <div id="searchbar">
        <input type="text" placeholder="Find Document">
        <img src="./icons/search.png" alt="search icon">
    </div>
    <button id="addDocumentBtn">
        Add Document
    </button>
</div>


<style>
    #searchbar-section{
        width: 100%;
        height: 20%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    #searchbar{
        width: 30%;
        height: 40px;
        min-width: 260px;
        display: flex;
        overflow: hidden;
        margin-left: 26px;
        border: 1px solid grey;
        justify-content: space-between;
    }

    #searchbar input{
        width: 90%;
        height: 100%;
        border: none;
        font-weight: 400;
        color: rgb(65, 65, 65);
    }

    #addDocumentBtn{
        cursor: pointer;
        color: white;
        border: none;
        padding: 12px 20px;
        margin-right: 26px;
        background-color:#2f6fc7;
    }

    @media (max-width: 550px){
        #searchbar-section{
            flex-direction: column;
            justify-content: space-around;
        }

        #searchbar{
            width: 90%;
            margin: 0px;
        }
    }

</style>