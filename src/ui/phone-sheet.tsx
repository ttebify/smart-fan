import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerTrigger } from '@ui-sdk/react/drawer';
import { useStore } from '../sim/store';
import { Controls } from './control-panel';
import { MechDetails } from './mech-panel';

/**
 * On a phone the side panels would cover the room, so their contents move into a bottom
 * sheet. It is not modal: the scene stays usable while the sheet is open.
 */
export function PhoneSheet() {
  const inspect = useStore(s => s.inspect);
  const set = useStore(s => s.set);
  const title = inspect ? 'Neck drive' : 'Smart Fan';
  return (
    <>
      {inspect && <button type="button" className="restore back" onClick={() => set({ inspect: false })}>× Back to room</button>}
      <Drawer modal={false}>
        <DrawerTrigger className="restore sheet-trigger">{inspect ? 'Neck drive' : 'Controls'}</DrawerTrigger>
        <DrawerContent className="sheet" initialFocus="content">
          <div className="head">
            <DrawerTitle render={<h1 />}>{title}</DrawerTitle>
            <DrawerClose className="icon" aria-label="Close">×</DrawerClose>
          </div>
          <div className="sheet-scroll">{inspect ? <MechDetails /> : <Controls />}</div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
