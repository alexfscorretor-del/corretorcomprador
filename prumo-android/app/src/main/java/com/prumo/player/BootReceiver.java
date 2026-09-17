package com.prumo.player;
import android.content.*;
public class BootReceiver extends BroadcastReceiver {
 @Override public void onReceive(Context c, Intent i) {
  if (Intent.ACTION_BOOT_COMPLETED.equals(i.getAction()) || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(i.getAction())) {
   Intent x=new Intent(c,MainActivity.class); x.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK|Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP); c.startActivity(x);
  }
 }
}
