# Catalog manufacturer-source register

Checked: **2026-08-22**

This register covers the 24 staged guidance records in `lib/catalog/repository.ts`. Only official manufacturer pages from Phonak, Signia, Widex, and ReSound were accepted. A `yes` value means the cited source directly supports that specific catalog field. `Unknown` means Audiosen has not recorded sufficient model-specific primary evidence; it does not mean the feature is unavailable. No negative (`no`) feature values were inferred.

The checks establish neither Audiosen inventory nor current local availability, price, warranty, offer eligibility, trial eligibility, or clinical suitability. Family-level pages support only family-level “option” claims. Compatibility remains device-, software-, market-, and configuration-dependent where the manufacturer says so.

All product-media rights remain **pending**. A manufacturer page being public does not grant Audiosen permission to copy or publish its images, video, logos, or other media. The local fallback assets remain withheld until an owner records commercial-use approval.

## Launch gate

These records are accessible only as staged guidance and are not owner-approved inventory. The catalog, brand, model, comparison, finder, and trial routes remain `noindex`; staged catalog URLs are excluded from the sitemap and from model/brand results in the public site search. No primary brand currently meets the launch threshold of at least four owner-approved database products. Manufacturer-source verification alone never satisfies that threshold.

## Source matrix

| # | Brand / repository key | Official primary source | Directly supported catalog fields | Still `unknown` | Checked | Media rights |
|---:|---|---|---|---|---|---|
| 1 | Phonak `audeo-infinio-ultra-sphere` | [Infinio Ultra manufacturer source sheet (PDF)](https://www.phonak.com/content/dam/celum/phonak/master-assets/en/documents/hearing-instruments/infinio-us/ph-flyer-infinio-digital-take-along-8.5x11-en-us.pdf) | Model identity; rechargeable option; Bluetooth connectivity | Auracast; app control; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 2 | Phonak `audeo-infinio-ultra-r` | [Audéo Infinio Ultra R](https://www.phonak.com/en-us/hearing-devices/hearing-aids/audeo-infinio) | Model identity; rechargeable; Bluetooth streaming; myPhonak app; CROS compatibility | Auracast; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 3 | Phonak `virto-r-infinio` | [Virto R Infinio](https://www.phonak.com/en-us/hearing-devices/hearing-aids/virto-infinio) | Model identity; ITE/custom fit; rechargeable; Bluetooth connectivity; myPhonak app pairing | Auracast; CROS; pediatric; power format | 2026-08-22 | Pending |
| 4 | Phonak `cros-infinio` | [CROS Infinio](https://www.phonak.com/en-us/hearing-devices/hearing-aids/cros-infinio) | Model identity; rechargeable; CROS pathway; Bluetooth connectivity when paired with a compatible Audéo Infinio hearing aid | Auracast; app control; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 5 | Phonak `naida-lumity` | [Naída Lumity](https://www.phonak.com/en-us/hearing-devices/hearing-aids/naida-l) | Family identity; BTE/power format; rechargeable family option; Bluetooth streaming; myPhonak app | Auracast; CROS; pediatric; custom fit | 2026-08-22 | Pending |
| 6 | Phonak `sky-lumity` | [Sky Lumity](https://www.phonak.com/en-us/hearing-devices/hearing-aids/sky-lumity) | Family identity; pediatric BTE pathway; rechargeable family option; Bluetooth connectivity; myPhonak Junior app | Auracast; CROS; power format; custom fit | 2026-08-22 | Pending |
| 7 | Signia `pure-charge-go-bct-ix` | [Pure Charge&Go BCT IX / IX family](https://www.signia.net/en/hearing-aids/integrated-xperience/pure-charge-go-ix/) | Model identity; RIC; rechargeable; Bluetooth streaming; Signia app | Auracast; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 8 | Signia `pure-charge-go-ix` | [Pure Charge&Go IX family](https://www.signia.net/en/hearing-aids/integrated-xperience/pure-charge-go-ix/) | Family identity; RIC; rechargeable; Bluetooth streaming; Signia app | Auracast; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 9 | Signia `silk-charge-go-ix` | [Silk Charge&Go IX](https://www.signia.net/en-us/hearing-aids/integrated-xperience/silk-charge-go-ix/) | Model identity; instant-fit CIC; rechargeable; Signia app | Bluetooth streaming; Auracast; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 10 | Signia `active-pro-ix` | [Active IX family](https://www.signia.net/en/hearing-aids/integrated-xperience/active-ix/) | Active Pro IX identity; earbud format; rechargeable; Bluetooth streaming | Auracast; app control; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 11 | Signia `styletto-ix` | [Styletto IX](https://www.signia.net/en-us/hearing-aids/integrated-xperience/styletto-ix/) | Model identity; slim RIC; rechargeable; Bluetooth streaming; app control | Auracast; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 12 | Signia `motion-charge-go-ix` | [Motion Charge&Go IX](https://www.signia.net/en-us/hearing-aids/integrated-xperience/motion-charge-go-ix/) | Family identity; BTE/power formats; rechargeable; Bluetooth streaming; Signia app | Auracast; CROS; pediatric; custom fit | 2026-08-22 | Pending |
| 13 | Widex `allure-ric-r-d` | [Allure RIC R D](https://www.widex.com/en/hearing-aids/allure/ric-r-d/) | Model identity; RIC; rechargeable; direct Bluetooth streaming; Allure app | Auracast (manufacturer describes a future update); CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 14 | Widex `allure-bte-r-d` | [Allure BTE R D](https://www.widex.com/en-us/hearing-aids/allure/bte-r-d/) | Model identity; BTE; rechargeable; Bluetooth streaming; Allure app | Auracast; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 15 | Widex `allure-ite-r-d` | [Allure ITE R D](https://www.widex.com/en-us/hearing-aids/allure/ite-r-d/) | Model identity; custom ITE; rechargeable; Bluetooth streaming; Allure app | Auracast; CROS; pediatric; power format | 2026-08-22 | Pending |
| 16 | Widex `smartric` | [SmartRIC](https://www.widex.com/en-us/hearing-aids/smartric/) | Model identity; RIC; rechargeable; Moment app | Bluetooth streaming; Auracast; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 17 | Widex `moment-sheer` | [Moment Sheer sRIC R D](https://www.widex.com/en-us/hearing-aids/moment-sheer/sric-r-d/) | Exact model identity; RIC; rechargeable; direct Bluetooth streaming; Moment app | Auracast; CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 18 | Widex `beyond` | [Official BEYOND app and streaming guidance](https://www.widex.com/en-au/blog/global/podcasts-and-hearing-aids/) | BEYOND family identity; BEYOND app; direct phone streaming | Rechargeable; Auracast; CROS; pediatric; power format; custom fit; current availability | 2026-08-22 | Pending |
| 19 | ReSound `vivia` | [ReSound Vivia](https://www.resound.com/en-us/hearing-aids/resound-hearing-aids/resound-vivia) | Family identity; rechargeable family option; Bluetooth LE Audio streaming; Auracast; Smart 3D app | CROS; pediatric; power format; custom fit | 2026-08-22 | Pending |
| 20 | ReSound `savi` | [ReSound Savi](https://www.resound.com/en-us/hearing-aids/resound-hearing-aids/resound-savi) | Family identity; rechargeable and custom-format options; Bluetooth LE Audio streaming; Auracast; Smart 3D app | CROS; pediatric; power format | 2026-08-22 | Pending |
| 21 | ReSound `nexia` | [ReSound Nexia professional product page](https://pro.resound.com/en-us/products/hearing-aids/nexia) | Family identity; rechargeable, power, custom and CROS options; Bluetooth LE Audio streaming; Auracast; Smart 3D app | Pediatric | 2026-08-22 | Pending |
| 22 | ReSound `omnia` | [ReSound OMNIA support](https://www.resound.com/en-us/help/hearing-aids/omnia) | Family identity; rechargeable, power and custom options; ReSound app controls | Bluetooth streaming; Auracast; CROS; pediatric; current availability | 2026-08-22 | Pending |
| 23 | ReSound `key` | [ReSound Key professional product page](https://pro.resound.com/en-us/products/hearing-aids/resound-key) | Family identity; multiple/custom formats; rechargeable family option; Bluetooth streaming; Smart 3D app | Auracast; CROS; pediatric; power format; current availability | 2026-08-22 | Pending |
| 24 | ReSound `vivia-rie` | [ReSound Vivia professional product page](https://pro.resound.com/en-us/products/hearing-aids/vivia) | Vivia family and RIE formats; rechargeable microRIE and CROS options; Bluetooth LE Audio streaming; Auracast; Smart 3D app | Pediatric; power format; custom fit; standalone “Vivia RIE” orderable-name status | 2026-08-22 | Pending |

## Boundary notes

- `scripts/import-staged-catalog.ts` can hash and import these 24 records into PostgreSQL as
  `DRAFT` products only. It requires an explicit active-Owner `--approved-by` for commit, never
  marks a Brand/Product as published, and records every legacy local media path as an unapproved
  reference with `UNVERIFIED` rights.
- Widex describes Allure Auracast support as dependent on a future software/app update and market/device availability. It therefore remains `unknown`, not `yes`.
- `ReSound Vivia RIE` is retained as a stable Audiosen route key. ReSound's source directly lists Vivia RIE variants, but does not present “Vivia RIE” as one standalone orderable model name.
- Widex BEYOND, ReSound OMNIA, and ReSound Key are supported by current official support, archive, or professional pages. Those pages do not prove current Audiosen or manufacturer-market availability.
- No source check grants media reuse rights. Media remains withheld independently of factual verification.
