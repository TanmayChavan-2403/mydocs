<script>
    import Data from "./Data.svelte";
    import Account from "./Account.svelte";
    export let component;
</script>


<div id="rightPannel">
    <div id="rightPannel-topSection"></div>
    <div id="rightPannel-bottomSection">
        {#if component === "data"}
            <Data />
        {:else if component === "account"}
            <Account  on:return />
        {/if}
    </div>
</div>



<style>
    #rightPannel{
        width: 83%;
        height: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        background-color: rgb(243, 250, 255);
    }

    #rightPannel-topSection{
        width: 100%;
        height: 20%;
    }

    #rightPannel-bottomSection{
        width: 90%;
        height: 80%;
        box-shadow: 0px 0px 16px 3px rgba(0,0,0,0.07);
    }

    @media (max-width: 750px){
        #rightPannel{
            width: 100%;
        }
    }

</style>