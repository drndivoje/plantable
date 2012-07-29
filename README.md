Jquery Plantable plugin
=========

JQuery Plantable plugin provides creating table plans using start and end date.

## Getting Started

Include jQuery and the plugin on a page. Then select div elemnt where you want to create plan table. Every plan table need to have start and end date.

```html
<div id='planContainer'>
</div>
```
To create table just pass start and end date.

```html
<script>
	$("#planContainer").plantable({start: new Date(2012,5,1), end: new Date(2012,6,24)})
</script>
```
The code below will create plan table from June 1st 2012 to July 24th 2012.

## Exporting plan to JSON String

It is possible to export already created plan table to JSON string. 

<script>
	$("#planContainer").plantable("export");
</script>