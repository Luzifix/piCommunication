var Example = function (output) {
    var self = this;
    self.type = 'example';
    self.output = output;

    self.__constructor = function () {
        console.log("-- Example script loaded --");

        setInterval(self.getAndSendData, 2500);

        return self;
    };

    self.getAndSendData = function () {
        self.send({
            location: 'living-room',
            temperament: 25.11
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

module.exports = Example;