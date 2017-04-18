var Weather = function (output) {
    var self = this;
    self.type = 'temperament';
    self.output = output;

    self.__constructor = function () {
        console.log("-- Weather script loaded --");

        setInterval(self.getAndSendData, 2000);

        return self;
    };

    self.getAndSendData = function () {
        self.send({
            location: 'kitchen',
            temperament: 99
        });
    };

    self.send = function (data) {
        output({
            type: self.type,
            data: data
        });
    };

    self.receive = function (data) {
        console.log(data);
    };

    return self.__constructor();
};

module.exports = Weather;