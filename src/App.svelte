<script>
	import LeftPannel from './components/LeftPannel.svelte'
	import RightPannel from './components/RightPannel.svelte';
	let component = 'data';
	
	function showAccountPage(e, type="") {
		if (e.detail.text){
			component = e.detail.text;
		} else{
			component = type
		}
		
	}
	
</script>




<LeftPannel on:click={e => showAccountPage(e, 'account')} />
<RightPannel {component} on:return={showAccountPage} />

<style>

</style>