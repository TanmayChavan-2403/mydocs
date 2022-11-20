<div id="login">
    <div id="username">
        <input class="inputField" type="text" value="" placeholder="Username">
    </div>
    <div id="password">
        <input class="inputField" type="text" value="" placeholder="Password">
    </div>
    <div id="confPassword">
        <input class="inputField" type="text" value="" placeholder="Confirm Password">
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

    #username, #password, #confPassword{
        width: 100%;
        height: 25%;
        display: flex;
        align-items: flex-start;
        justify-content: center;
    }

    #submitButton{
        color: white;
        cursor: pointer;
        padding: 10px 25px;
        background-color: #0071ce;
    }

    .inputField{
        width: 75%;
        height: 65%;
    }

</style>