<script>
    import LoginRegis from "./account/LoginRegisMainContainer.svelte";
    import AccountInfo from "./account/AccountInfo.svelte";
</script>

<div id="account">
    <!-- <LoginRegis /> -->
    <AccountInfo on:return />
</div>

<style>
    #account{
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: white;
    }
</style>