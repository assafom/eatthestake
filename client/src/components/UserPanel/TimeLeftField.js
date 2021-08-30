import React, {useContext} from "react";
import DisplayContext from "../../context/DisplayContext";



export default function TimeLeftField() {
    const displayContext = useContext(DisplayContext);
    const {userDetails} = displayContext;


    function extractTime(part) {
        let daysLeft = userDetails["daysLeft"];
        if (part === "d")
          return Math.floor(daysLeft);
        if (part === "h")
          return Math.floor((daysLeft - Math.floor(daysLeft)) * 24);
        if (part === "m")
          return Math.floor((daysLeft - Math.floor(daysLeft) - Math.floor(daysLeft - Math.floor(daysLeft))) * 60);
        return undefined;
      }

    return (
        <>
            <div className="time-left-label">
                <div>
                Time Left
                </div>
                <div className="time">
                <div>
                    <div>
                    {extractTime("d")}
                    </div>
                    <div>
                    days
                    </div>
                </div>
                <div>
                    <div>
                    {extractTime("h")}
                    </div>
                    <div>
                    hours
                    </div>
                </div>
                <div>
                    <div>
                    {extractTime("m")}
                    </div>
                    <div>
                    mins
                    </div>
                </div>
                </div>
            </div>
            <hr/>
        </>
    )
}