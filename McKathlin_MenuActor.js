//=============================================================================
// McKathlin - Menu Actor Change Patch
// for RPG Maker MV
// McKathlin_MenuActor.js
//=============================================================================

var Imported = Imported || {};
Imported.McKathlin_MenuActor = true;

var McKathlin = McKathlin || {};
McKathlin.MenuActor = McKathlin.MenuActor || {};

/*:
 * @plugindesc v0.1.0 Minor UX adjustments to actor changes in menus
 * @author McKathlin
 * 
 * @param Keep Status Page
 * @desc When true, Yanfly's Status Menu will stay on its
 * current status page when the actor selection changes.
 * @default true
 * 
 * @param Keep Skill Page
 * @desc When true, Skill Menu's skill type window
 * will stay on its current index when the actor changes.
 * @default false
 * 
 * @param Menu Actor Left Right
 * @desc When true, the player can use left and right arrow inputs
 * to switch actor in the Status, Equip, and Magic menus.
 * @default true
 * 
 * @param Shop Actor PageUp PageDown
 * @desc When true, the player can use Page Up / Page Down
 * to switch actor in Yanfly's Shop Menu.
 * @default true
 * 
 * @help
 * Menu Actor Change Patch, by McKathlin
 * ============================================================================
 * Compatibility Note
 * 
 * This plugin modifies Yanfly's Status Menu Core and Shop Menu Core.
 * Please place McKathlin_MenuActor.js BELOW both these Yanfly plugins.
 * 
 * ============================================================================
 * How to Use This Plugin
 * 
 * Menu Actor Change Patch makes the following changes on top of Yanfly menus:
 * 
 * * Yanfly's Status Menu holds the submenu selection in the same place when
 *   the selected actor changes.
 * * The Status Menu (Yanfly or not) allows changing the selected actor with
 *   left and right arrow inputs as well as the usual Page Up and Page Down.
 * * The Shop Menu allows changing the selected actor with Page Up and Page
 *   Down inputs as well as the usual left and right arrows.
 *   When Shop Menu PageUp PageDown is set to true, the usual PageUp/PageDown
 *   cursor jumping behavior is turned OFF when a weapon or armor is selected
 *   in the Buy Window.
 * 
 * Any of these features can be set to true or false by changing the
 * corresponding plugin parameters.
 * 
 * * The plugin parameter Keep Skill Page allows you to keep the skill type
 *   selection index unchanged when the Actor is changed. This is set to false
 *   by default, as many RPGs don't have comparable skill types across all
 *   playable characters.
 * 
 * ============================================================================
 * License
 * 
 * CC0 1.0 Universal
 * 
 * By marking the work with a CC0 public domain dedication, the creator is
 * giving up their copyright and allowing reusers to distribute, remix, adapt,
 * and build upon the material in any medium or format, even for commercial
 * purposes. 
 * 
 */

//=============================================================================
// Parameters
//=============================================================================
// Parameter Parsing
//-----------------------------------------------------------------------------

McKathlin.Core = McKathlin.Core || {};
McKathlin.Core.parseBoolean = function(parameter, defaultValue=false) {
	switch (String(parameter).trim().toLowerCase()) {
		case 'true':
		case 't':
		case 'yes':
		case 'y':
		case 'on':
		case '1':
			return true;
		case 'false':
		case 'f':
		case 'no':
		case 'n':
		case 'off':
		case '0':
			return false;
		default:
			return defaultValue;
	} // end switch
};

//-----------------------------------------------------------------------------
// Parameter Variables
//-----------------------------------------------------------------------------

McKathlin.MenuActor.Parameters =
	PluginManager.parameters('McKathlin_MenuActor');

McKathlin.MenuActor.Param = McKathlin.MenuActor.Param || {};

McKathlin.MenuActor.Param.KeepStatusPage = McKathlin.Core.parseBoolean(
	McKathlin.MenuActor.Parameters["Keep Status Page"]);
McKathlin.MenuActor.Param.KeepSkillPage = McKathlin.Core.parseBoolean(
	McKathlin.MenuActor.Parameters["Keep Skill Page"]);
McKathlin.MenuActor.Param.MenuArrows = McKathlin.Core.parseBoolean(
	McKathlin.MenuActor.Parameters["Menu Actor Left Right"]);
McKathlin.MenuActor.Param.ShopPageInputs = McKathlin.Core.parseBoolean(
	McKathlin.MenuActor.Parameters["Shop Actor PageUp PageDown"]);

//=============================================================================
// Keep Status Page on Actor Change
//=============================================================================

if (Imported.YEP_StatusMenuCore && McKathlin.MenuActor.Param.KeepStatusPage) {
	// Replacement method
	Window_StatusCommand.prototype.setActor = function(actor) {
		if (this._actor === actor) return;
		this._actor = actor;
		this.refresh();
		// this.select(0); // Disabled selection reset.
	};
}

//=============================================================================
// Keep Skill Page on Actor Change
//=============================================================================

if (McKathlin.MenuActor.Param.KeepSkillPage) {
	// Replacement method
	Window_SkillType.prototype.setActor = function(actor) {
		if (this._actor !== actor) {
			this._actor = actor;
			this.refresh();
			// Only change selection if necessary to avoid invalid selection.
			if (this._index > this._list.length) {
				this.select(0);
			}
		}
	};
}

//=============================================================================
// Menu Left-Right Arrow Keys
//=============================================================================

if (McKathlin.MenuActor.Param.MenuArrows) {
	//-------------------------------------------------------------------------
	// New override method, to apply selectively
	// Lets chosen windows use special left-right handlers.
	//-------------------------------------------------------------------------
	McKathlin.MenuActor.Window_processLeftRight = function() {
		if (this.active && this.isOpen() && 1 == this.maxCols()) {
			// Special left-right handlers are for single-column windows only.
			if (this.isHandled('left') && Input.isRepeated('left')) {
				SoundManager.playCursor();
				this.callHandler('left');
				return; // Return early after handling to avoid glitches.
			} else if (this.isHandled('right') && Input.isRepeated('right')) {
				SoundManager.playCursor();
				this.callHandler('right');
				return; // Return early after handling to avoid glitches.
			}
		}
		Window_Selectable.prototype.processHandling.call(this);
	};

	//-------------------------------------------------------------------------
	// Status Menu Left-Right
	//-------------------------------------------------------------------------

	if (Imported.YEP_StatusMenuCore) {
		// Apply override
		Window_StatusCommand.prototype.processHandling =
			McKathlin.MenuActor.Window_processLeftRight;

		// Alias method
		McKathlin.MenuActor.Scene_Status_setCommandWindowHandlers =
			Scene_Status.prototype.setCommandWindowHandlers;
		Scene_Status.prototype.setCommandWindowHandlers = function() {
			McKathlin.MenuActor.Scene_Status_setCommandWindowHandlers.call(this);
			this._commandWindow.setHandler('left', this.previousActor.bind(this));
			this._commandWindow.setHandler('right', this.nextActor.bind(this));
		};
	} else {
		// Apply override
		Window_Status.prototype.processHandling =
			McKathlin.MenuActor.Window_processLeftRight;

		// Alias method
		McKathlin.MenuActor.Scene_Status_create =
			Scene_Status.prototype.create;
		Scene_Status.prototype.create = function() {
			McKathlin.MenuActor.Scene_Status_create.call(this);
			this._statusWindow.setHandler('left', this.previousActor.bind(this));
			this._statusWindow.setHandler('right', this.nextActor.bind(this));
		};
	}

	//-------------------------------------------------------------------------
	// Equip Menu Left-Right
	//-------------------------------------------------------------------------

	// Apply override
	Window_EquipCommand.prototype.processHandling =
		McKathlin.MenuActor.Window_processLeftRight;

	// Alias method
	McKathlin.MenuActor.Scene_Equip_createCommandWindow =
		Scene_Equip.prototype.createCommandWindow;
	Scene_Equip.prototype.createCommandWindow = function() {
		McKathlin.MenuActor.Scene_Equip_createCommandWindow.call(this);
		this._commandWindow.setHandler('left', this.previousActor.bind(this));
		this._commandWindow.setHandler('right', this.nextActor.bind(this));
	};

	//-------------------------------------------------------------------------
	// Skill Menu Left-Right
	//-------------------------------------------------------------------------

	// Apply override
	Window_SkillType.prototype.processHandling =
		McKathlin.MenuActor.Window_processLeftRight;

	// Alias method
	McKathlin.MenuActor.Scene_Skill_createSkillTypeWindow =
		Scene_Skill.prototype.createSkillTypeWindow;
	Scene_Skill.prototype.createSkillTypeWindow = function() {
		McKathlin.MenuActor.Scene_Skill_createSkillTypeWindow.call(this);
		this._skillTypeWindow.setHandler('left', this.previousActor.bind(this));
		this._skillTypeWindow.setHandler('right', this.nextActor.bind(this));
	};
} // endif McKathlin.MenuActor.Param.MenuArrows

//=============================================================================
// Shop Menu PageUp / PageDown
//=============================================================================

if (Imported.YEP_ShopMenuCore && McKathlin.MenuActor.Param.ShopPageInputs) {
	// Alias method
	McKathlin.MenuActor.Window_ShopStatus_updateParamSwitch =
		Window_ShopStatus.prototype.updateParamSwitch;
	Window_ShopStatus.prototype.updateParamSwitch = function() {
		if (!this.isEquipItem()) return;
		if (this.getInput('pageup')) {
			SoundManager.playCursor();
			this.adjustLeft();
			this.refresh();
		} else if (this.getInput('pagedown')) {
			SoundManager.playCursor();
			this.adjustRight();
			this.refresh();
		} else {
			McKathlin.MenuActor.Window_ShopStatus_updateParamSwitch.call(this);
		}
	};

	// New override method
	Window_ShopBuy.prototype.cursorPagedown = function() {
		if (this.isEquipItem()) {
			// Usual cursor page down behavior is disabled for equippables;
			// this input is used for Actor switch instead.
		} else {
			// Non-equippables can be paged through, per native RMMV behavior.
			Window_Selectable.prototype.cursorPagedown.call(this);
		}
	};

	// New override method
	Window_ShopBuy.prototype.cursorPageup = function() {
		if (this.isEquipItem()) {
			// Usual cursor page up behavior is disabled for equippables;
			// this input is used for Actor switch instead.
		} else {
			// Non-equippables can be paged through, per native RMMV behavior.
			Window_Selectable.prototype.cursorPageup.call(this);
		}
	};

	// New helper method
	Window_ShopBuy.prototype.isEquipItem = function() {
		const item = this.item();
		return DataManager.isWeapon(item) || DataManager.isArmor(item);
	};
} // endif ShopPageInputs enabled
