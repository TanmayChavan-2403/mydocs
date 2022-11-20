<script>

</script>


<div id="leftPannel">
    <div id="leftPannel-TopSection">
        <img id="logo" src="./Logo.png" alt="Logo" />
        <div id="createTask">
            <h5> New Document </h5>
            <img src="./icons/add.png" alt="Add icon">
        </div>
        <div id="home">
            <img class="menuIcon" src="./icons/home.png" alt="home icon">
            <p> Home </p>
        </div>
        <div id="sharedData">
            <img class="menuIcon" src="./icons/share.png" alt="share data">
            <p> Shared Data </p>
        </div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div id="leftPannel-BottomSection" on:click>
        <img src="./icons/avatar.png" alt="Avatar">
        <h4> Account name</h4>
    </div>

</div>


<style>
    #leftPannel{    
        width: 17%;
        height: 100%;
        display: flex;
        flex-wrap: wrap;
        min-width: 220px;
        align-content: space-between;
        box-shadow: 5px 0px 10px 5px rgba(134, 127, 127, 0.1);
    }

    #leftPannel-TopSection{
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        height: fit-content;
        justify-content: center;
    }

    #logo{
        width: 90%;
        margin-top: 10px;
        height: fit-content;
    }

    #createTask{
        width: 85%;
        color: white;
        display: flex;
        cursor: pointer;
        align-items: center;
        margin: 25px 0px 10px;
        background-color: #2f6fc7;
        justify-content: center;
        height: clamp(40px, 40px, 6vh);
    }

    #createTask img{
        height: 60%;
        padding: 6px;
        border-radius: 50%;
        margin: 0px 10px;
        background-color: #21518f;
    }

    #home, #sharedData{
        width:85%;
        height: 40px;
        display: flex;
        font-weight: 800;
        margin-top: 10px;
        font-size: 0.9rem;
        align-items: center;
        justify-content: left;
        color: rgb(119, 118, 118);
    }

    .menuIcon{
        height: 55%;
        object-fit: contain;
        margin: 0px 10px 0px 0px;
    }






    #leftPannel-BottomSection{
        width: 100%;
        display: flex;
        cursor: pointer;
        color: #747474;
        align-items: center;
        justify-content: left;
    }

    #leftPannel-BottomSection img{
        height: 75%;
        margin: 0px 10px;
    }


    @media (max-width: 750px){
        #leftPannel{
            display: none;
        }
    }
    

</style>