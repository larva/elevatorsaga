

var asUser = function(user, weight, floorCount, floorHeight) {
    user.weight = weight;
    user.currentFloor = 0;
    user.destinationFloor = 0;
    user.antisocial = false;
    user.done = false;
    user.removeMe = false;

    user.appearOnFloor = function(floor, destinationFloorNum) {
        var floorPosY = (floorCount - 1) * floorHeight - floor.level * floorHeight + 30;
        user.currentFloor = floor.level;
        user.destinationFloor = destinationFloorNum;
        user.moveTo(null, floorPosY);
        user.pressFloorButton(floor);
    };

    user.pressFloorButton = function(floor) {
        if(user.destinationFloor < user.currentFloor) {
            floor.pressDownButton();
        } else {
            floor.pressUpButton();
        }
    };

    user.mashElevatorButtons = function(elevator) {
        _.sample(_.range(0, floorCount), _.random(0,floorCount)).forEach(function(randomFloorNum,i,a) { elevator.pressFloorButton(randomFloorNum); });
    };

    user.exitNow = function(elevator) {
        elevator.userExiting(user);
        user.currentFloor = elevator.currentFloor;
        user.setParent(null);
        var destination = user.x + 100;
        user.done = true;
        user.trigger("exited_elevator", elevator);
        user.trigger("new_state");

        user.moveToOverTime(destination, null, 1 + Math.random()*0.5, linearInterpolate, function() {
            user.removeMe = true;
            user.trigger("removed");
            user.off("*");
        });
    };

    user.elevatorAvailable = function(elevator, floor) {
        var mashNDash = (user.antisocial && (_.random(1) == 0));
        if(user.done || user.parent !== null || user.isBusy()) {
            return;
        }

        if(!user.antisocial && !elevator.isSuitableForTravelBetween(user.currentFloor, user.destinationFloor)) {
            // Not suitable for travel - don't use this elevator
            return;
        }

        var pos = elevator.userEntering(user);
        if(pos) {
            // Success
            user.setParent(elevator);
            user.trigger("entered_elevator", elevator);

            user.moveToOverTime(pos[0], pos[1], 1, undefined, function() {
                if (mashNDash && user.antisocial) { // Mash and dash
                    user.destinationFloor = user.currentFloor;
                    user.mashElevatorButtons(elevator);
                    user.exitNow(elevator);
                } else {
                    elevator.pressFloorButton(user.destinationFloor);
                }
            });

            if (!mashNDash) {
                var exitAvailableHandler = function(floorNum) {
                    if(elevator.currentFloor === user.destinationFloor) {
                        if (user.antisocial) { // After using elevator
                            user.mashElevatorButtons(elevator);
                        }
                        user.exitNow(elevator);
                        elevator.off("exit_available", exitAvailableHandler);
                    }
                };
                elevator.on("exit_available", exitAvailableHandler);
            }
        } else {
            user.pressFloorButton(floor);
        }
    };

    return user;
};
