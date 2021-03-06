module.exports = ( () => {

  const nodemailer = require('nodemailer');
  const sgTransport = require('nodemailer-sendgrid-transport');

  // Hold onto the 'singleton' transporter for use in the
  // application. Just keep reusing it.
  var transporter = nodemailer.createTransport(sgTransport(config.mail.options));

  const deliver = (mailOptions) => {
    return new Promise( (resolve, reject) => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) { return reject(err) }
        resolve(info);
      });
    });
  };

  var mod = {
    deliver: deliver
  };

  return mod;

}());
