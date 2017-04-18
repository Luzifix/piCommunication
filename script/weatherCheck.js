var Weather = function (output) {
    var self = this;
    self.output = output;

    self.__constructor = function () {
        console.log("-- WeatherCheck script loaded --");

        return self;
    };

    self.receive = function (data) {
        if(data.message.type)
        {
            console.log('In "'+data.message.data.location+'" ist es '+data.message.data.temperament+'C°')
        }
    };

    return self.__constructor();
};

module.exports = Weather;