<div id="login">
    <div id="username">
        <input class="inputField" type="text" value="" placeholder="Username">
    </div>
    <div id="password">
        <input class="inputField" type="text" value="" placeholder="Password">
    </div>
    <div id="submitButton">
        <h4> Submit </h4>
    </div>
</div>


<style>
    #login{
        width: 100%;
        height: 80%;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-content: center;
    }

    #username, #password{
        width: 100%;
        height: 25%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    #submitButton{
        color: white;
        cursor: pointer;
        margin-top: 10px;
        padding: 10px 25px;
        background-color: #0071ce;
    }

    .inputField{
        width: 75%;
        height: 65%;
    }

</style>