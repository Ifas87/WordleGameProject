
import java.util.Timer;
import java.util.TimerTask;

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 *
 * @author Safi
 */
public class timerTask extends TimerTask {
    public static int seconds = 0;
    public int oldseconds = 0;
    public Timer timer;
    
    timerTask(int initial, int old_seconds, Timer timer){
        this.seconds = initial;
        this.oldseconds = oldseconds;
        this.timer = timer;
    }
    
    public void run() {
        changer(this.seconds, this.oldseconds);
    }
    
    public void changer(int current_seconds, int old_seconds){
        if(current_seconds <= 0){
            this.timer.cancel();
            this.timer.purge();
            return;
        }
        
        current_seconds -= 1;
        old_seconds = current_seconds;
        System.out.println("Time now: " + current_seconds + " " + old_seconds);
    }
}