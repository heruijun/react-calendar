(function() {
	"use strict";

	var weekDaysStrings = ['日', '一', '二', '三', '四', '五', '六'];
	var weekDaysShortStrings = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
	var wheelItemHeight = 40; // 滚动的单元格高度
	var wheelSpaceHeight = 200; // 滚动区域的高度

	var dataHours = [
		{name: '10', value: '10'},
		{name: '11', value: '11'},
		{name: '12', value: '12'},
		{name: '13', value: '13'},
		{name: '14', value: '14'},
		{name: '15', value: '15'},
		{name: '16', value: '16'},
		{name: '17', value: '17'},
		{name: '18', value: '18'},
		{name: '19', value: '19'},
		{name: '20', value: '20'},
		{name: '21', value: '21'},
		{name: '22', value: '22'},
		{name: '23', value: '23'}
	];

	var dataMainTime = [
		{name: '00', value: '00'},
		{name: '05', value: '05'},
		{name: '10', value: '10'},
		{name: '15', value: '15'},
		{name: '20', value: '20'},
		{name: '25', value: '25'},
		{name: '30', value: '30'},
	    {name: '35', value: '35'},
	    {name: '40', value: '40'},
	    {name: '45', value: '45'},
	    {name: '50', value: '50'},
	    {name: '55', value: '55'}
	];

	// 选中的年月日
	var selectYear, selectMonth, selectDay, selectHour = '10', selectTime = '00';
	var dateToday = new Date();
	var hourScrollPosition = 0, timeScrollPosition = 0;

	function validateObjectType(property, type) {
		if (property instanceof type) {
			return;
		}
		throw new Error('expected instance of ' + type.name + ', but type was ' +
			typeof(property) + '.');
	}

	var Entry = Backbone.Model.extend({
		defaults: {
			date: new Date(),
			summary: 'date'
		},
		isSameDay: function(other) {
			var date = this.get('date');
			return date.getYear() === other.getYear() && date.getMonth() === other.getMonth() &&
				date.getDate() === other.getDate();
		}
	});

	var DateCollection = Backbone.Collection.extend({
		model: Entry
	});

	var dateCollection = (function() {
		var daysWithPerson = [];
		for(var i=0, len=personOnDays.length;i<len;i++) {
			daysWithPerson.push(new Entry({
				date: new Date(personOnDays[i].day),
				summary: personOnDays[i].person + '人'
			}));
		}
		return new DateCollection(daysWithPerson);
	})();

	// 人数的单元格
	var CalendarEntry = React.createClass({
		propTypes: {
			data: React.PropTypes.instanceOf(Entry)
		},
		render: function() {
			return (
				<div className="entry">
					<span className="personCount">
						{this.props.data.get('summary')}
					</span>
				</div>
			);
		}
	});

	// 绘制单元格
	var CalendarCell = React.createClass({
		propTypes: {
			onClick: React.PropTypes.func,
			date: React.PropTypes.instanceOf(Date),
			inFocussedMonth: React.PropTypes.bool,
			data: React.PropTypes.array
		},
		onClick: function(e) {
			if(this.props.isPastDay) {
				return;
			}
			if(this.props.inFocussedMonth){
				TimeWheelManager.show();
				var date = this.props.date;
				selectYear = date.getFullYear();
				selectMonth = date.getMonth() + 1;
				selectDay = this.props.children;

				var year = document.querySelector('#selectYear'),
					month = document.querySelector('#selectMonth'),
					day = document.querySelector('#selectDay'),
					week = document.querySelector('#selectWeek');

				year.innerHTML = selectYear;
				month.innerHTML = selectMonth;
				day.innerHTML = selectDay;
				week.innerHTML = weekDaysStrings[date.getDay()];
				// this.props.onClick(e.nativeEvent, this.props.date.toLocaleDateString());
			}
		},
		render: function() {
			return (
				<td onClick={this.onClick} className={"calendarCell" + (this.props.isPastDay?" shadowCell":"")}>
					<div className={"calendarCellBox" + ((this.props.data.length > 0 && this.props.inFocussedMonth)? " cellHasPerson":"")}>
						<div className="date">
							{this.props.inFocussedMonth &&
							<span className="dateText">{this.props.children}</span>
							}
						</div>
						{this.props.inFocussedMonth &&
							// 绘制人数
							this.props.data.map(function(result, index) {
								return <CalendarEntry data={result} key={'CalendarEntry_'+index} />
							})
						}
					</div>
				</td>
			);
		}
	});

	var ColHead = React.createClass({
		render: function() {
			return (
				<th>
					{this.props.day}
				</th>
			);
		}
	});

	// 整体布局绘制
	var CalendarMonth = React.createClass({
		propTypes: {
			year: React.PropTypes.number,
			month: React.PropTypes.number,
			onClick: React.PropTypes.func,
			weekDays: React.PropTypes.arrayOf(React.PropTypes.string),
			data: React.PropTypes.instanceOf(DateCollection)
		},
		getInitialState: function() {
			this.firstDateOfMonth = new Date(this.props.year, this.props.month, 1);
			var firstDayOfMonth = this.firstDateOfMonth.getDay();

			this.dayOffset = (firstDayOfMonth - 1) % 7;
			this.rowIndices = [1, 2, 3, 4, 5, 6];
			return {
				data: this.props.data
			};
		},
		componentWillMount: function() {
			this.props.data.on('change add', function() {
				this.forceUpdate();
			}.bind(this));
		},
		componentWillUnmount: function() {
			this.props.data.off('change');
		},
		render: function() {
			return (
				<div>
					<div className="yeaarTitle">{this.props.year}年{this.props.month+1}月</div>
					<table className="calendarTable">
						<thead className="thead">
						<tr>
							{
								this.props.weekDays.map(function(result) {
									return <ColHead day={result} key={'ColHead_'+result.toString()} />
								})
							}
						</tr>
						</thead>
						<tbody className="tbody">
						{
							this.rowIndices.map(function(result, row){
								return (
									<tr key={'CalendarMonth-row_'+row}>
										{
											this.props.weekDays.map(function(result, col){
												var day = row * 7 + col - this.dayOffset;
												var date = new Date(this.firstDateOfMonth.getTime());
												date.setDate(day);
												return <CalendarCell
													onClick={this.props.onClick}
													date = {date}
													inFocussedMonth={date.getMonth()===this.props.month}
													isPastDay={(date.getTime() < dateToday.getTime()) && (day != dateToday.getDate())}
													data={
							                            this.state.data.filter(function(datum){
							                              return datum.isSameDay(date);
							                            })
							                          }
													key={'CalendarCell_'+date.valueOf()}>
													{date.getDate()}
												</CalendarCell>
											}, this)
										}
									</tr>
								)
							}, this)
						}
						</tbody>
					</table>
				</div>
			);
		}
	});

	function SmoothScroll(el, offset) {
		this.el = el;
		this.offset = offset;
		
		this.scrollBy = function(){
			var oldPosition = el.scrollTop, newPosition = oldPosition + offset;
			if(offset > 0) {
				if(oldPosition < newPosition) {
					oldPosition ++;
					el.scrollTop = oldPosition;
				} else {
					cancelAnimationFrame(this.scrollBy);
				}
			}
			if(offset < 0) {
				if(oldPosition > newPosition) {
					oldPosition --;
					el.scrollTop = oldPosition;
				} else {
					cancelAnimationFrame(this.scrollBy);
				}
			}
		}
	};

	SmoothScroll.prototype.scroll = function(){
		requestAnimationFrame(this.scrollBy);
	}

	var body = document.querySelector('body');
	var bodyScrollTop = 0;

	var TimeWheelManager = {
		show: function(){
			body.classList.add('fixedScoll');
			body.style.top = -bodyScrollTop + 'px';
			var datetimeBg = document.querySelector('.datetimeBg');
			datetimeBg.style.display = 'block';
			var datetimeWheel = document.querySelector('.datetimeWheel');
			datetimeWheel.style.display = 'block';
			var hourSelect = document.querySelector('.hourSelect');
			var timeSelect = document.querySelector('.timeSelect');
			hourSelect.scrollTop = hourScrollPosition;
			timeSelect.scrollTop = timeScrollPosition;
		},
		close: function(){
			var datetimeWheel = document.querySelector('.datetimeWheel');
			datetimeWheel.style.display = 'none';
			var datetimeBg = document.querySelector('.datetimeBg');
			datetimeBg.style.display = 'none';
			body.classList.remove('fixedScoll');
			body.scrollTop = -parseInt(body.style.top, 10);
		}
	}

	var getScrollVal = (function(){
		return function(e){
			var el = e.target;
			var hourScrollHeight = el.scrollHeight;
			var hourPosition = el.scrollTop + wheelItemHeight / 2;
			var itemList = el.getElementsByTagName('li');
			var scrollStart = hourPosition, targetScroll = 0, targetScroll2 = 0;
			var selectItem, nearTop, nearDown;
			var offset = 0;
			// var direction = directionDetect(e);
			// var touchDis = touchDistance(e);
			// console.log(touchDis);

			for(var i=0,len=itemList.length;i<len;i++){
				// 清除选中状态
				(function(i){
					itemList[i].classList.remove('selectItem');
					itemList[i].classList.remove('nearby');
					targetScroll = wheelItemHeight * i;
					targetScroll2 = targetScroll + wheelItemHeight;
					if(hourPosition >= targetScroll && hourPosition <= targetScroll2) {
						nearTop = itemList[i + 1];
						selectItem = itemList[i + 2];
						nearDown = itemList[i + 3];
						offset = targetScroll + wheelItemHeight / 2 - scrollStart;
					}
				})(i);
			}

			selectItem.classList.add('selectItem');
			nearTop.classList.add('nearby');
			nearDown.classList.add('nearby');

			if(offset != 0) {
				var scrollObj = new SmoothScroll(el, offset);
				scrollObj.scroll();
			}

			return {
				'selectItem' : selectItem,
				'scrollPosition': el.scrollTop
			};
		}
	})();

	var MonthList = React.createClass({
		render: function() {
			var monthNodes = [];
			var baseYear = new Date().getFullYear();
			var baseMonth = new Date().getMonth();
			for (var i=0; i < this.props.count; i++) {
				if(baseMonth == 12) {
					baseYear++;
					baseMonth=0;
				}
				monthNodes.push(<CalendarMonth
					year={baseYear}
					month={baseMonth++}
					onClick={console.log.bind(console)}
					weekDays={weekDaysStrings}
					data={dateCollection} />
				);
			}

			return <div className="calendarList">{monthNodes}</div>;
		}
	});

	// 检测滑动方向
	var directionDetect = (function(){
		var previous = 0, direction;
		return function(e){
			e.target.scrollTop > previous ? direction = 'down' : direction = 'up';
			previous = e.target.scrollTop;
			return direction;
		}
	})();

	// 触摸距离测算
	var touchDistance = (function(){
		var previous = 0;
		return function(e){
			var dis = Math.abs(e.target.scrollTop - previous);
			previous = e.target.scrollTop;
			return dis;
		}
	})();

	var HourList = React.createClass({
	    getInitialState: function () {
	        return {selected: this.props.selected};
	    },

	    render: function () {
	        var hourList = this.props.data.map(function (item) {
	            var selected = item.value == this.state.selected ? 'selectItem' : '';
	            return (
	                <li data-hour={item.value} className={selected}><span>{item.name}</span></li>
	            );
	        }, this);

	        return (
	        	<ul>
					<li><span></span></li>
					<li><span></span></li>
					{hourList}
					<li><span></span></li>
					<li><span></span></li>
				</ul>
	        );
	    }
	});

	var TimeList = React.createClass({
	    getInitialState: function () {
	        return {selected: this.props.selected};
	    },

	    render: function () {
	        var timeList = this.props.data.map(function (item) {
	            var selected = item.value == this.state.selected ? 'selectItem' : '';
	            return (
	                <li data-time={item.value} className={selected}><span>{item.name}</span></li>
	            );
	        }, this);

	        return (
	        	<ul>
					<li><span></span></li>
					<li><span></span></li>
					{timeList}
					<li><span></span></li>
					<li><span></span></li>
				</ul>
	        );
	    }
	});

	var HourWheel = React.createClass({
		getHourPosition: function(e) {
			var hourVal = document.querySelector('.hourVal');
			var scrollResult = getScrollVal(e);
			hourVal.innerHTML = selectHour = scrollResult.selectItem.getAttribute('data-hour');
			hourScrollPosition = scrollResult.scrollPosition;
		},
		render: function() {
			return (
				<div className="hourSelect" onScroll={this.getHourPosition}>
					<HourList data={dataHours} selected={'10'}/>
				</div>
			);
		}
	});

	var TimeWheel = React.createClass({
		getTimePosition: function(e) {
			var timeVal = document.querySelector('.timeVal');
			var scrollResult = getScrollVal(e);
			timeVal.innerHTML = selectTime = scrollResult.selectItem.getAttribute('data-time');
			timeScrollPosition = scrollResult.scrollPosition;
		},
		render: function() {
			return (
				<div className="timeSelect" onScroll={this.getTimePosition}>
					<TimeList data={dataMainTime} selected={'00'}/>
				</div>
			);
		}
	});

	// 时间滑轮
	var DatetimeWheel = React.createClass({
		componentDidMount: function() {
			document.addEventListener('scroll', function(){
				bodyScrollTop = body.scrollTop;
			}, false);
		},

		onSure: function(){
			TimeWheelManager.close();
			selectDay = parseInt(selectDay);
			selectMonth = parseInt(selectMonth);
			if(selectMonth < 10) {
				selectMonth = '0' + selectMonth;
			}
			if(selectDay < 10) {
				selectDay = '0' + selectDay;
			}
			var date = selectYear + '-' + selectMonth + '-' + selectDay;
			var time = selectHour + ':' + selectTime;
			onSelectFinish(date, time);
		},
		onModify: function(){
			TimeWheelManager.close();
			onTimeModify();
		},
		render: function() {
			return (
				<div className="datetimeWheel">
					<div className="datetimeBar">
						<span className="datetimeTitle"><span id="selectYear"></span>年<span id="selectMonth"></span>月<span id="selectDay"></span>日 周<span id="selectWeek"></span><span className="hourVal">10</span>:<span className="timeVal">00</span></span>
						<span className="datetimeSure" onClick={this.onSure}>确定</span>
						<span className="datetimeModify" onClick={this.onModify}>修改</span>
					</div>
					<div className="datetimeSelect">
						<span className="selectLine"></span>
						<HourWheel />
						<TimeWheel />
					</div>
				</div>
			);
		}
	});

	React.render(
		<div>
			<MonthList count={4} />
			<div className="datetimeBg" />
			<DatetimeWheel />
		</div>,
		document.getElementById('calendar')
	);

})();