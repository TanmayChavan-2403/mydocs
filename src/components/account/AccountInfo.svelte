<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function returnFromAccComp(){
        console.log('Dispatching...');
        dispatch('return', {
			text: 'data'
		});
    }

</script>


<div id="accountInfo">
    <div id="heading">
        <!-- <img id='return' src="./icons/return.png" alt="Return icon"> -->
        <div class='heading-content-container'>
            <div class='heading-content'>
                <img id='avatar' src="./icons/avatar1.png" alt="Avatar">
                <h2> Hackytech </h2>
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <img on:click={returnFromAccComp} id='returnBtn' src="./icons/close.png" alt="Close icon">
        </div>
    </div>
    
    <div id='inputFields'>
        <div class="field">
            <h4>Account Id:</h4> <p> 1feasfae45#asfe4 </p>
        </div>
        <div class="field"></div>
        <div class="field"></div>
    </div>
</div>




<style>
    #accountInfo{
        width: 100%;
        height: 100%;
    }

    #heading{
        width: 100%;
        height: 15%;
        display: flex;
        margin-bottom: 25px;
        align-items: center;
        justify-content: center;
        border-bottom: 1px dashed rgb(82, 82, 82); 
    }

    .heading-content-container, .heading-content{
        width: 84%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .heading-content{
        width: fit-content;
    }
    
    #avatar{
        height: 80%;
        margin: 0px 20px 0px 0px;
    }

    #returnBtn{
        height: 50%;
        cursor: pointer;
        margin: 0px 10px;
    }

    #inputFields{
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-content: flex-start;
        height: calc(85% - 25px);
    }

    .field{
        width:84%;
        height: 45px;
        display: flex;
        margin: 10px 0px;
        padding: 0px 10px;
        align-items: center;
        box-shadow: aquamarine;
        background-color: whitesmoke;
    }

    .field input{
        width: 60px;
        height: 30px;
        padding: 0px;
        overflow: hidden;
        cursor: pointer;
        border: none;
        border-radius: 5px;
    }

    .field h4 {
        font-weight: 400;
        margin-right: 15px;
        font-family: 'Poppins', Ubuntu; 

    }

</style>