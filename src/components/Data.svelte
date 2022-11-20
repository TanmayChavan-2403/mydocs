<script>
    import Searchbar from "./subComponents/Searchbar.svelte";
    import FolderListContainer from "./subComponents/FolderListContainer.svelte";
    import FileListContainer from "./subComponents/FileListContainer.svelte";
</script>

<div id="main">
    <Searchbar />
    <!-- <FolderListContainer /> -->
    <FileListContainer />
</div>

<style>

    #main{
        width: 100%;
        height: 100%;
        background-color: white;
    }

</style>