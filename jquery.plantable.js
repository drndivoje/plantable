(function($) {
	function formatDate(date) {
		var m_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"), month = m_names[date.getMonth()], year = date.getFullYear(), date = date.getDate();
		return date + ' ' + month + ' ' + year;
	}

	function createDialog(dialogId,parentEl) {
		//create dialog element
		var dialog = document.createElement("div");
		dialog.id = dialogId;
		dialog.setAttribute('class','daylyDialog');
		var form = document.createElement("form");
		form.id = 'addDayPlan';
		var textArea = document.createElement('textarea');
		textArea.id = 'addPlanTextArea';
		form.appendChild(textArea);
		dialog.appendChild(form);
		var saveBtn = document.createElement('button');
		saveBtn.innerHTML = 'Save';
		var closeBtn = document.createElement('button');
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
	ModalDialog.prototype.show = function() {
		var top = this.dialogEl.parent().scrollTop() + 10;
		this.dialogEl.css('top', top + "px");
		this.dialogEl.show();
	};
	ModalDialog.prototype.close = function() {
		this.dialogEl.hide();
	};
	ModalDialog.prototype.onSaveClick = function(form) {
		//do something
	};
	var Calendar = function(from, to) {
		this.fromDate = from;
		this.toDate = to;
		var fromDay = this.fromDate.getDay(), prevDays = fromDay - 1, toDay = this.toDate.getDay(), postDays = 7 - toDay;
		if (fromDay == 0)
			prevDays = 6;
		if (toDay == 0)
			postDays = 0;
		this.prevDays = prevDays;
		this.postDays = postDays;
		this.days = (this.toDate.getTime() - this.fromDate.getTime()) / 86400000, this.daysInWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], this.months_names = new Array("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December");
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
			this.dialog.show();
		},
		render : function(el) {
			this.dialog = createDialog('entryDialog',el);
			
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
			el.css('z-index','1');
			el.css('position','relative');
		}
	}
	$.fn.calendar = function(options) {
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
				$(cal_instance.activeCell).append($('<p class="entry">'+ entry +'</p>'));
			};

		});
	}
})(jQuery);
