import {
  CSSResultGroup,
  html,
  LitElement,
  PropertyValues,
  TemplateResult,
  unsafeCSS,
} from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { createRef, ref, Ref } from 'lit/directives/ref.js';
import { DateRange } from '../camera/range';
import { localize } from '../localize/localize';
import mediaFilterStyle from '../scss/media-filter.scss';
import { ExtendedHomeAssistant } from '../types';
import { dispatchFrigateCardEvent } from '../utils/basic';

export interface ValueLabel<T> {
  value?: T;
  label: string;
}

export interface MediaFilterCoreSelection {
  cameraIDs?: Set<string>;
  what?: Set<string>;
  where?: Set<string>;
  when?: MediaFilterCoreWhenSelection;
  favorite?: MediaFilterCoreFavoriteSelection;
}

type FilterElement<T> = HTMLElement & {
  selectedItem?: ValueLabel<T>;
};

export enum MediaFilterCoreFavoriteSelection {
  Favorite = 'favorite',
  NotFavorite = 'not-favorite',
}

export enum MediaFilterCoreWhen {
  Today = 'today',
  Yesterday = 'yesterday',
  PastWeek = 'past-week',
  PastMonth = 'past-month',
  Custom = 'custom',
}

export interface MediaFilterCoreWhenSelection {
  selection: MediaFilterCoreWhen;
  custom?: DateRange;
}

@customElement('frigate-card-media-filter-core')
export class FrigateCardMediaFilterCore extends LitElement {
  @property({ attribute: false })
  public hass?: ExtendedHomeAssistant;

  @property({ attribute: false })
  public cameraOptions?: ValueLabel<string>[];

  @property({ attribute: false })
  public whenOptions?: ValueLabel<MediaFilterCoreWhenSelection>[];

  @property({ attribute: false })
  public whatOptions?: ValueLabel<string>[];

  @property({ attribute: false })
  public whereOptions?: ValueLabel<string>[];

  @property({ attribute: false })
  public defaults?: MediaFilterCoreSelection;

  protected _cameraOptions?: ValueLabel<string>[];
  protected _whenOptions?: ValueLabel<MediaFilterCoreWhenSelection>[];
  protected _whatOptions?: ValueLabel<string>[];
  protected _whereOptions?: ValueLabel<string>[];
  protected _favoriteOptions: ValueLabel<MediaFilterCoreFavoriteSelection>[];

  protected _refCamera: Ref<FilterElement<string>> = createRef();
  protected _refWhen: Ref<FilterElement<MediaFilterCoreWhenSelection>> = createRef();
  protected _refWhat: Ref<FilterElement<string>> = createRef();
  protected _refWhere: Ref<FilterElement<string>> = createRef();
  protected _refFavorite: Ref<FilterElement<MediaFilterCoreFavoriteSelection>> =
    createRef();

  constructor() {
    super();
    this._favoriteOptions = [
      {
        value: undefined,
        label: localize('media_filter.all'),
      },
      {
        value: MediaFilterCoreFavoriteSelection.Favorite,
        label: localize('media_filter.favorite'),
      },
      {
        value: MediaFilterCoreFavoriteSelection.NotFavorite,
        label: localize('media_filter.not_favorite'),
      },
    ];
  }

  protected _valueChangedHandler(ev: CustomEvent<{ value: unknown }>): void {
    // Handler is called on initial load -- skip it.
    if (!ev.detail.value) {
      return;
    }
    const values: MediaFilterCoreSelection = {
      ...(this._refCamera.value &&
        this._refCamera.value.selectedItem?.value && {
          cameraIDs: new Set([this._refCamera.value.selectedItem.value]),
        }),
      ...(this._refWhen.value &&
        this._refWhen.value.selectedItem?.value && {
          when: this._refWhen.value.selectedItem?.value,
        }),
      ...(this._refWhat.value &&
        this._refWhat.value.selectedItem?.value && {
          what: new Set([this._refWhat.value.selectedItem.value]),
        }),
      ...(this._refWhere.value &&
        this._refWhere.value.selectedItem?.value && {
          where: new Set([this._refWhere.value.selectedItem?.value]),
        }),
      ...(this._refFavorite.value &&
        this._refFavorite.value.selectedItem?.value !== undefined && {
          favorite: this._refFavorite.value.selectedItem?.value,
        }),
    };
    dispatchFrigateCardEvent(this, 'media-filter-core:change', values);
  }

  protected willUpdate(changedProps: PropertyValues): void {
    if (changedProps.has('cameraOptions')) {
      this._cameraOptions = [
        {
          value: undefined,
          label: localize('media_filter.all'),
        },
        ...(this.cameraOptions ?? []),
      ];
    }
    if (changedProps.has('whenOptions')) {
      // Time based options are not pre-computed here to ensure relative dates
      // (e.g. 'today') are always calculated when activated not when rendered.
      this._whenOptions = [
        {
          value: undefined,
          label: localize('media_filter.all'),
        },
        {
          value: { selection: MediaFilterCoreWhen.Today },
          label: localize('media_filter.today'),
        },
        {
          value: { selection: MediaFilterCoreWhen.Yesterday },
          label: localize('media_filter.yesterday'),
        },
        {
          value: { selection: MediaFilterCoreWhen.PastWeek },
          label: localize('media_filter.past_week'),
        },
        {
          value: { selection: MediaFilterCoreWhen.PastMonth },
          label: localize('media_filter.past_month'),
        },
        ...(this.whenOptions ?? []),
      ];
    }
    if (changedProps.has('whatOptions')) {
      this._whatOptions = [
        { value: undefined, label: localize('media_filter.all') },
        ...(this.whatOptions ?? []),
      ];
    }
    if (changedProps.has('whereOptions')) {
      this._whereOptions = [
        { value: undefined, label: localize('media_filter.all') },
        ...(this.whereOptions ?? []),
      ];
    }
  }

  /**
   * Master render method.
   * @returns A rendered template.
   */
  protected render(): TemplateResult | void {
    return html`
      <ha-combo-box
        ${ref(this._refWhen)}
        .hass=${this.hass}
        .label=${localize('media_filter.when')}
        .items=${this._whenOptions}
        .allowCustomValue=${false}
        @value-changed=${this._valueChangedHandler.bind(this)}
      ></ha-combo-box>
      ${this.cameraOptions
        ? html` <ha-combo-box
            ${ref(this._refCamera)}
            .hass=${this.hass}
            .label=${localize('media_filter.camera')}
            .items=${this._cameraOptions}
            .allowCustomValue=${false}
            @value-changed=${this._valueChangedHandler.bind(this)}
          ></ha-combo-box>`
        : ''}
      ${this.whatOptions
        ? html` <ha-combo-box
            ${ref(this._refWhat)}
            .hass=${this.hass}
            .label=${localize('media_filter.what')}
            .items="${this._whatOptions}"
            .allowCustomValue=${false}
            @value-changed=${this._valueChangedHandler.bind(this)}
          ></ha-combo-box>`
        : ''}
      ${this.whereOptions
        ? html`<ha-combo-box
            ${ref(this._refWhere)}
            .hass=${this.hass}
            .label=${localize('media_filter.where')}
            .items=${this._whereOptions}
            .allowCustomValue=${false}
            @value-changed=${this._valueChangedHandler.bind(this)}
          ></ha-combo-box>`
        : ''}
      <ha-combo-box
        ${ref(this._refFavorite)}
        .hass=${this.hass}
        .label=${localize('media_filter.favorite')}
        .items=${this._favoriteOptions}
        .allowCustomValue=${false}
        @value-changed=${this._valueChangedHandler.bind(this)}
      ></ha-combo-box>
    `;
  }

  static get styles(): CSSResultGroup {
    return unsafeCSS(mediaFilterStyle);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'frigate-card-media-filter-core': FrigateCardMediaFilterCore;
  }
}
