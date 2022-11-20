<script>
    import Login from "./Login.svelte";
    import Registration from "./Registration.svelte";
    let login = true;
    let registration = false;

    function changeContainer(container){
        if (container === "registration"){
            registration = true
            login = false;
        } else {
            registration = false;
            login = true;
        }
    }

</script>

<div id="loginRegistration">
    <div id="heading">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div id="loginButton" class:backgroundHighlight={login} on:click={(e) => changeContainer('login')}>
            <h4>Login</h4>
        </div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div id="registrationButton" class:backgroundHighlight={registration} on:click={(e) => changeContainer('registration')}>
            <h4>Registration</h4>
        </div>
    </div>
    {#if login}
        <Login />
    {:else}
        <Registration />    
    {/if}
    
</div>

<style>
    #loginRegistration{
        width: 50%;
        height: 60%;
        box-shadow: 0px 0px 20px 0px rgba(0,0,0,0.14);
    }

    #heading{
        width: 100%;
        height: 20%;
        cursor: pointer;
        display: flex;
    }

    #loginButton, #registrationButton{
        width: 50%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: whitesmoke;

    }

    .backgroundHighlight{
        background-color: white !important;
    }

</style>