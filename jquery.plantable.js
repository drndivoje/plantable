(function($) {
	/*
	 * Simple dialog for inserting dayly entry
	 */
	var ModalDialog = function(options) {
		this.dialogEl = $(options.element);
		this.saveBtn = $(options.saveBtn);
		this.closeBtn = $(options.closeBtn);
		this.mask = $(options.mask);
		var me = this;
		this.saveBtn.click(function() {
			var form = me.dialogEl.children('form')[0];
			me.onSaveClick(form);
			me.close();
		});
		this.closeBtn.click(function() {
			me.close();
		});
		this.dialogEl.hide();
		this.mask.hide();
	};
	ModalDialog.prototype.setHeader = function(header) {
		this.dialogEl.children('div.dialogHeader').text(header);
	}
	/*
	 * Displaying dialog
	 */
	ModalDialog.prototype.show = function() {
		var top = this.dialogEl.parent().scrollTop() + 10;
		//for postition mask and dialog
		this.dialogEl.css('top', top + "px");
		this.mask.css('top', top + "px");
		this.mask.show();
		this.dialogEl.fadeIn();
		//set focus on textarea
		$("#addPlanTextArea").focus();
	};
	/*
	 * Closing dialog
	 */
	ModalDialog.prototype.close = function() {
		this.mask.hide();
		this.dialogEl.fadeOut();
		this.onCloseClick();
	};
	ModalDialog.prototype.onSaveClick = function(form) {
		//do something
	};
	ModalDialog.prototype.onCloseClick = function() {
		//do something
	}
	/*
	 * Updating content of textarea on dialog.
	 * @param options content that will be added to textarea
	 *
	 */
	ModalDialog.prototype.reset = function(options) {
		var content = options.text, dateStr = options.headerText;
		this.setHeader(dateStr);
		if (content != undefined) {
			$("#addPlanTextArea").html(content);
		} else {
			$("#addPlanTextArea").val("");
		}
	};
	/*
	 * Calendar object represents plan. Days are grouped in weeks. Every week start from Monday to Sunday.
	 *
	 * @param from start date
	 * @param to end date
	 */
	var Calendar = function(from, to) {
		this.fromDate = from;
		this.toDate = to;
		var fromDay = this.fromDate.getDay(), prevDays = fromDay - 1, toDay = this.toDate.getDay(), postDays = 7 - toDay;
		if (fromDay == 0)
			prevDays = 6;
		if (toDay == 0)
			postDays = 0;
		//prevDays property is number of days fromMonday to start date in the first week of plan.
		this.prevDays = prevDays;
		//postdays property is number of day from end date to Sunday in the last week of plan
		this.postDays = postDays;
		//number of days from start to end date of plan
		this.days = (this.toDate.getTime() - this.fromDate.getTime()) / 86400000, this.daysInWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
		return this;
	};
	Calendar.prototype = {
		init : function(el) {
			this.render(el);
			var me = this;
			$("table.plantable tr td.active").click(function() {
				me.activeCell = this;
				//$('#entryDialog').modal('show');
				me.onClickCell(this);
			});
		},
		formatCell: function(cellEl){
		         var entryEl = cellEl.children[1];
			 var isOverflowing = entryEl.clientHeight < entryEl.scrollHeight;
			 if(isOverflowing){
		        	$(entryEl).css('border-bottom-style','dotted');
				$(entryEl).css(	'border-bottom-width','2px');	
				$(entryEl).css(	'border-bottom-color','#000000');	
			 }
			
		},
		onClickCell : function(el) {
			var cell = $(el), entryEl = cell.children('p.entry'), dateEl = cell.children('span.cellDate'), dateString = dateEl.text();
			if (entryEl.length) {
				var textEntry = entryEl.html();
				this.dialog.reset({
					text : textEntry,
					headerText : dateString
				});
			} else {
				this.dialog.reset({
					headerText : dateString
				});
			}
			cell.addClass("curentCell");
			//disable scrollbar
			this.element.css("overflow", "hidden");
			this.dialog.show();
		},
		render : function(el) {
			this.element = el;
			this.dialog = createDialog('entryDialog', el);

			var tableEl = document.createElement('table'), weekEl = document.createElement("tr"), headerEl = document.createElement('thead'), daysInWeekEl = document.createElement('tr');
			createCell = function(date, className) {
				var dayCellEl = document.createElement('td'), dateEl = document.createElement('span');
				dateEl.setAttribute('class', 'cellDate')
				dayCellEl.setAttribute('class', className);
				dateEl.innerHTML = formatDate(date);
				dayCellEl.appendChild(dateEl);
				return dayCellEl;
			};
			tableEl.setAttribute('class', 'plantable');
			//inserting header with name of day
			for (var jj = 0; jj < 7; jj++) {
				var dayInWeek = document.createElement('th');
				dayInWeek.innerHTML = this.daysInWeek[jj];
				daysInWeekEl.appendChild(dayInWeek);
			}
			headerEl.appendChild(daysInWeekEl);
			tableEl.appendChild(headerEl);
			//inserting prvious day in the same week where is start date
			for (var j = 0; j < this.prevDays; j++) {
				var dateTime = this.fromDate.getTime() - (86400000 * (this.prevDays - j)), d = new Date(dateTime);
				weekEl.appendChild(createCell(d, 'iniactive'));
			}
			//insering active days and weeks (between start and end date)
			for (var i = 0; i <= this.days; i++) {
				var dateTime = this.fromDate.getTime() + (86400000 * i), d = new Date(dateTime);
				weekEl.appendChild(createCell(d, 'active'));	
				//If it is Sunday close row div
				if (d.getDay() == 0) {
					tableEl.appendChild(weekEl);
					weekEl = document.createElement('tr');
				}
			}
			//insering days after end date in same week
			for (var k = 1; k <= this.postDays; k++) {
				var dateTime = this.toDate.getTime() + (86400000 * k), d = new Date(dateTime);
				weekEl.appendChild(createCell(d, 'iniactive'));
				if (k == this.postDays) {
					tableEl.appendChild(weekEl);
				}
			}
			el.append(tableEl);
			el.css('z-index', '1');
			el.css('position', 'relative');

		},
		/*
		 * Export to JSON string
		 */
		exportToJSON : function() {
			var element = $(this.element);
			var jsonObj = {
				start : this.fromDate,
				end : this.toDate,
				duration : this.days,
				planEntries : []
			};
			//TODO: make it more elegant
			element.children('table.plantable').children('tr').children('td.active').each(function() {
				var dateEl = $(this).children('span.cellDate'), dateText = dateEl.text(), entryEl = $(this).children('p.entry');

				if (entryEl.length) {
					var cellObj = {
						date : new Date(dateText)
					};
					cellObj.entry = entryEl.text();
					jsonObj.planEntries.push(cellObj);
				}

			});
			return JSON.stringify(jsonObj);
		}
	}
	$.fn.plantable = function(options) {
		if (options === 'export') {
			var cal_instance = $(this).data('plantable');
			return cal_instance.exportToJSON();
		}
		var from = options.start;
		var to = options.end;
		var cal_instance = new Calendar(from, to);

		return this.each(function() {
			$(this).addClass('planParent');
			//calculate width and height
			var height = $(this).css('height');
			if (height === "0px") {
				$(this).addClass('defaultHeight');
			}
			cal_instance.init($(this));
			cal_instance.dialog.onSaveClick = function(formEl) {
				var form = $(formEl), entry = form.children('textarea').val();
				activeCell = $(cal_instance.activeCell);
				if (entry === "") {
					var cellEntryEl = activeCell.children('p.entry');
					cellEntryEl.remove();
					return;
				}
				//Insert breakdowns for every new row of textareastring
				entry = entry.replace(/\n/g, '</br>')
				if (activeCell.children('p.entry').length) {
					activeCell.children('p.entry').html(entry);

				} else {
					activeCell.append($('<p class="entry">' + entry + '</p>'));
				}
				activeCell.removeClass("curentCell");
				//enable scrollbar
				cal_instance.element.css('overflow', 'auto');
			};
			cal_instance.dialog.onCloseClick = function() {
				//enable scrollbar
				cal_instance.element.css('overflow', 'auto');
				$(cal_instance.activeCell).removeClass("curentCell");
				cal_instance.formatCell(cal_instance.activeCell);

			};
			$(this).data('plantable', cal_instance);
		});
	};
	/*
	 * Private functions
	 */
	function formatDate(date) {
		var m_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"), month = m_names[date.getMonth()], year = date.getFullYear(), date = date.getDate();
		return date + ' ' + month + ' ' + year;
	}

	function createDialog(dialogId, parentEl) {
		//create mask
		var mask = document.createElement('div');
		mask.setAttribute('class', 'dialogMask');
		parentEl.append(mask);
		//create dialog element
		var dialog = document.createElement("div");
		dialog.id = dialogId;
		dialog.setAttribute('class', 'daylyDialog');
		var header = document.createElement('div');
		header.setAttribute('class', 'dialogHeader');
		dialog.appendChild(header);
		var form = document.createElement("form");
		form.id = 'addDayPlan';
		var textArea = document.createElement('textarea');
		textArea.id = 'addPlanTextArea';
		form.appendChild(textArea);
		dialog.appendChild(form);
		var saveBtn = document.createElement('button');
		saveBtn.setAttribute('class', 'dialogBtn');
		saveBtn.innerHTML = 'Save';
		var closeBtn = document.createElement('button');
		closeBtn.setAttribute('class', 'dialogBtn')
		closeBtn.innerHTML = 'Close';
		dialog.appendChild(saveBtn);
		dialog.appendChild(closeBtn);
		$(parentEl).append(dialog);
		return new ModalDialog({
			element : dialog,
			saveBtn : saveBtn,
			closeBtn : closeBtn,
			mask : mask
		});
	}

})(jQuery);
