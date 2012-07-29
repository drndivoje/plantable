(function($) {
	/*
	 * Simple dialog for inserting plan for clicked day cell
	 */
	var ModalDialog = function(options) {
		this.dialogEl = $(options.element);
		this.saveBtn = $(options.saveBtn);
		this.closeBtn = $(options.closeBtn);
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
	};
	/*
	 * Displaying dialog
	 */
	ModalDialog.prototype.show = function() {
		var top = this.dialogEl.parent().scrollTop() + 10;
		this.dialogEl.css('top', top + "px");
		this.dialogEl.show();
		//set focus on textarea
		$("#addPlanTextArea").focus();
	};
	/*
	 * Closing dialog
	 */
	ModalDialog.prototype.close = function() {
		this.dialogEl.hide();
	};
	ModalDialog.prototype.onSaveClick = function(form) {
		//do something
	};
	/*
	 * Updating content of textarea on dialog.
	 * @param content content that will be added to textarea
	 *
	 */
	ModalDialog.prototype.reset = function(content) {
		if (content != undefined) {
			$("#addPlanTextArea").val(content);
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
		onClickCell : function(el) {
			var entryEl = $(el).children('p.entry');
			if (entryEl.length) {
				var textEntry = entryEl.text();
				this.dialog.reset(textEntry);
			} else {
				this.dialog.reset();
			}
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
			var elemnent = $(this.element);
			var jsonObj = {
				start : this.fromDate,
				end : this.toDate,
				duration : this.days,
				planEntries : []
			};
			//TODO: make it more elegant
			elemnent.children('table.plantable').children('tr').children('td.active').each(function() {
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
				var form = $(formEl);
				var entry = form.children('textarea').val();
				//Insert breakdowns for every new row of textareastring
				entry = entry.replace(/\n/g,'</br>')
				if ($(cal_instance.activeCell).children('p.entry').length) {
					$(cal_instance.activeCell).children('p.entry').text(entry);
				} else {
					$(cal_instance.activeCell).append($('<p class="entry">' + entry + '</p>'));
				}
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
		//create dialog element
		var dialog = document.createElement("div");
		dialog.id = dialogId;
		dialog.setAttribute('class', 'daylyDialog');
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
			closeBtn : closeBtn
		});
	}

})(jQuery);
