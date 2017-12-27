import React, { Component } from 'react';

class Contact extends Component {
  render() {

	if (this.props.data) {
		var name = this.props.data.name;
		var city = this.props.data.address.city;
		var county = this.props.data.address.county;
		var country = this.props.data.address.country;
		var postcode = this.props.data.address.postcode;
		var phone = this.props.data.phone;
		var email = this.props.data.email;
	}
	 return (
	<section id="contact">
			<div className="row section-head">
				<div className="two columns header-col">
					<h1><span>Get In Touch.</span></h1>
				</div>
				<div className="ten columns">
						<p className="lead">Want to get in touch? Fill in the form below.
						</p>
				</div>
			</div>
			<div className="row">
				<div className="eight columns">
					<form action="" method="post" id="contactForm" name="contactForm">
					<fieldset>
						<div>
							<label htmlFor="contactName">Name <span className="required">*</span></label>
							<input type="text" value="" size="35" id="contactName" name="contactName" />
						</div>
						<div>
							<label htmlFor="contactEmail">Email <span className="required">*</span></label>
							<input type="text" value="" size="35" id="contactEmail" name="contactEmail" />
						</div>
						<div>
							<label htmlFor="contactSubject">Subject</label>
							<input type="text" value="" size="35" id="contactSubject" name="contactSubject" />
						</div>
						<div>
							<label htmlFor="contactMessage">Message <span className="required">*</span></label>
							<textarea cols="50" rows="15" id="contactMessage" name="contactMessage"></textarea>
						</div>
						<div>
							<button className="submit">Submit</button>
							<span id="image-loader">
								<img alt="" src="images/loader.gif" />
							</span>
						</div>
					</fieldset>
					</form>
					<div id="message-warning">Oops! Couldn't send that, try again later.</div>
					<div id="message-success">
						<i className="fa fa-check"></i>Your message was sent, thank you!<br />
					</div>
				</div>
				<aside className="four columns footer-widgets">
					<div className="widget widget_contact">
						<h4>Address and Phone</h4>
						<p className="address">
							{name}<br />
							{city}, {county} {postcode}<br />
							{country}<br />
							<span>{phone}</span><br />
							<span>{email}</span>
						</p>
					</div>
				</aside>
		</div>
	</section> 
	 );
  }
}

export default Contact;
