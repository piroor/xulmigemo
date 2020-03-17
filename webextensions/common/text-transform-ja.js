// This file is licensed under GPL2.
// See also: /license/COPYING.txt
'use strict';

import * as TextTransform from './text-transform.js';

export const HIRAGANA = 1 << 0;
export const KATAKANA = 1 << 1;
export const HIRAGANA_KATAKANA = 1 << 2;


/* based on Ruby/Romkan ( http://0xcc.net/ruby-romkan/ ) */

const mKunreiSource = `
\u3041	xa	\u3042	a	\u3043	xi	\u3044	i	\u3045	xu
\u3046	u	\u3046\u309b	vu	\u3046\u309b\u3041	va	\u3046\u309b\u3043	vi	\u3046\u309b\u3047	ve
\u3046\u309b\u3049	vo	\u3047	xe	\u3048	e	\u3049	xo	\u304a	o

\u304b	ka	\u304c	ga	\u304d	ki	\u304d\u3083	kya	\u304d\u3085	kyu
\u304d\u3087	kyo	\u304e	gi	\u304e\u3083	gya	\u304e\u3085	gyu	\u304e\u3087	gyo
\u304f	ku	\u3050	gu	\u3051	ke	\u3052	ge	\u3053	ko
\u3054	go

\u3055	sa	\u3056	za	\u3057	si	\u3057\u3083	sya	\u3057\u3085	syu
\u3057\u3087	syo	\u3058	zi	\u3058\u3083	zya	\u3058\u3085	zyu	\u3058\u3087	zyo
\u3059	su	\u305a	zu	\u305b	se	\u305c	ze	\u305d	so
\u305e	zo

\u305f	ta	\u3060	da	\u3061	ti	\u3061\u3083	tya	\u3061\u3085	tyu
\u3061\u3087	tyo	\u3062	di	\u3062\u3083	dya	\u3062\u3085	dyu	\u3062\u3087	dyo

\u3063	xtu
\u3063\u3046\u309b	vvu	\u3063\u3046\u309b\u3041	vva	\u3063\u3046\u309b\u3043	vvi
\u3063\u3046\u309b\u3047	vve	\u3063\u3046\u309b\u3049	vvo
\u3063\u304b	kka	\u3063\u304c	gga	\u3063\u304d	kki	\u3063\u304d\u3083	kkya
\u3063\u304d\u3085	kkyu	\u3063\u304d\u3087	kkyo	\u3063\u304e	ggi	\u3063\u304e\u3083	ggya
\u3063\u304e\u3085	ggyu	\u3063\u304e\u3087	ggyo	\u3063\u304f	kku	\u3063\u3050	ggu
\u3063\u3051	kke	\u3063\u3052	gge	\u3063\u3053	kko	\u3063\u3054	ggo	\u3063\u3055	ssa
\u3063\u3056	zza	\u3063\u3057	ssi	\u3063\u3057\u3083	ssya
\u3063\u3057\u3085	ssyu	\u3063\u3057\u3087	ssyo	\u3063\u3057\u3087	ssho
\u3063\u3058	zzi	\u3063\u3058\u3083	zzya	\u3063\u3058\u3085	zzyu	\u3063\u3058\u3087	zzyo
\u3063\u3059	ssu	\u3063\u305a	zzu	\u3063\u305b	sse	\u3063\u305c	zze	\u3063\u305d	sso
\u3063\u305e	zzo	\u3063\u305f	tta	\u3063\u3060	dda	\u3063\u3061	tti
\u3063\u3061\u3083	ttya	\u3063\u3061\u3085	ttyu	\u3063\u3061\u3087	ttyo	\u3063\u3062	ddi
\u3063\u3062\u3083	ddya	\u3063\u3062\u3085	ddyu	\u3063\u3062\u3087	ddyo	\u3063\u3064	ttu
\u3063\u3065	ddu	\u3063\u3066	tte	\u3063\u3067	dde	\u3063\u3068	tto	\u3063\u3069	ddo
\u3063\u306f	hha	\u3063\u3070	bba	\u3063\u3071	ppa	\u3063\u3072	hhi
\u3063\u3072\u3083	hhya	\u3063\u3072\u3085	hhyu	\u3063\u3072\u3087	hhyo	\u3063\u3073	bbi
\u3063\u3073\u3083	bbya	\u3063\u3073\u3085	bbyu	\u3063\u3073\u3087	bbyo	\u3063\u3074	ppi
\u3063\u3074\u3083	ppya	\u3063\u3074\u3085	ppyu	\u3063\u3074\u3087	ppyo	\u3063\u3075	hhu
\u3063\u3075\u3041	ffa	\u3063\u3075\u3043	ffi	\u3063\u3075\u3047	ffe	\u3063\u3075\u3049	ffo
\u3063\u3076	bbu	\u3063\u3077	ppu	\u3063\u3078	hhe	\u3063\u3079	bbe	\u3063\u307a	ppe
\u3063\u307b	hho	\u3063\u307c	bbo	\u3063\u307d	ppo	\u3063\u3084	yya	\u3063\u3086	yyu
\u3063\u3088	yyo	\u3063\u3089	rra	\u3063\u308a	rri	\u3063\u308a\u3083	rrya
\u3063\u308a\u3085	rryu	\u3063\u308a\u3087	rryo	\u3063\u308b	rru	\u3063\u308c	rre
\u3063\u308d	rro

\u3064	tu	\u3065	du	\u3066	te	\u3067	de	\u3068	to
\u3069	do

\u306a	na	\u306b	ni	\u306b\u3083	nya	\u306b\u3085	nyu	\u306b\u3087	nyo
\u306c	nu	\u306d	ne	\u306e	no

\u306f	ha	\u3070	ba	\u3071	pa	\u3072	hi	\u3072\u3083	hya
\u3072\u3085	hyu	\u3072\u3087	hyo	\u3073	bi	\u3073\u3083	bya	\u3073\u3085	byu
\u3073\u3087	byo	\u3074	pi	\u3074\u3083	pya	\u3074\u3085	pyu	\u3074\u3087	pyo
\u3075	hu	\u3075\u3041	fa	\u3075\u3043	fi	\u3075\u3047	fe	\u3075\u3049	fo
\u3076	bu	\u3077	pu	\u3078	he	\u3079	be	\u307a	pe
\u307b	ho	\u307c	bo	\u307d	po

\u307e	ma	\u307f	mi	\u307f\u3083	mya	\u307f\u3085	myu	\u307f\u3087	myo
\u3080	mu	\u3081	me	\u3082	mo

\u3083	xya	\u3084	ya	\u3085	xyu	\u3086	yu	\u3087	xyo
\u3088	yo

\u3089	ra	\u308a	ri	\u308a\u3083	rya	\u308a\u3085	ryu	\u308a\u3087	ryo
\u308b	ru	\u308c	re	\u308d	ro

\u308e	xwa	\u308f	wa	\u3090	wi	\u3091	we
\u3092	wo	\u3093	n

\u3093	n'
\u3067\u3043	dyi
\u30fc	-
\u3061\u3047	tye
\u3063\u3061\u3047	ttye
\u3058\u3047	zye
`.trim();

const mHepburnSource = `
\u3041	xa	\u3042	a	\u3043	xi	\u3044	i	\u3045	xu
\u3046	u	\u3046\u309b	vu	\u3046\u309b\u3041	va	\u3046\u309b\u3043	vi	\u3046\u309b\u3047	ve
\u3046\u309b\u3049	vo	\u3047	xe	\u3048	e	\u3049	xo	\u304a	o

\u304b	ka	\u304c	ga	\u304d	ki	\u304d\u3083	kya	\u304d\u3085	kyu
\u304d\u3087	kyo	\u304e	gi	\u304e\u3083	gya	\u304e\u3085	gyu	\u304e\u3087	gyo
\u304f	ku	\u3050	gu	\u3051	ke	\u3052	ge	\u3053	ko
\u3054	go

\u3055	sa	\u3056	za	\u3057	shi	\u3057\u3083	sha	\u3057\u3085	shu
\u3057\u3087	sho	\u3058	ji	\u3058\u3083	ja	\u3058\u3085	ju	\u3058\u3087	jo
\u3059	su	\u305a	zu	\u305b	se	\u305c	ze	\u305d	so
\u305e	zo

\u305f	ta	\u3060	da	\u3061	chi	\u3061\u3083	cha	\u3061\u3085	chu
\u3061\u3087	cho	\u3062	di	\u3062\u3083	dya	\u3062\u3085	dyu	\u3062\u3087	dyo

\u3063	xtsu
\u3063\u3046\u309b	vvu	\u3063\u3046\u309b\u3041	vva	\u3063\u3046\u309b\u3043	vvi
\u3063\u3046\u309b\u3047	vve	\u3063\u3046\u309b\u3049	vvo
\u3063\u304b	kka	\u3063\u304c	gga	\u3063\u304d	kki	\u3063\u304d\u3083	kkya
\u3063\u304d\u3085	kkyu	\u3063\u304d\u3087	kkyo	\u3063\u304e	ggi	\u3063\u304e\u3083	ggya
\u3063\u304e\u3085	ggyu	\u3063\u304e\u3087	ggyo	\u3063\u304f	kku	\u3063\u3050	ggu
\u3063\u3051	kke	\u3063\u3052	gge	\u3063\u3053	kko	\u3063\u3054	ggo	\u3063\u3055	ssa
\u3063\u3056	zza	\u3063\u3057	sshi	\u3063\u3057\u3083	ssha
\u3063\u3057\u3085	sshu	\u3063\u3057\u3087	ssho
\u3063\u3058	jji	\u3063\u3058\u3083	jja	\u3063\u3058\u3085	jju	\u3063\u3058\u3087	jjo
\u3063\u3059	ssu	\u3063\u305a	zzu	\u3063\u305b	sse	\u3063\u305c	zze	\u3063\u305d	sso
\u3063\u305e	zzo	\u3063\u305f	tta	\u3063\u3060	dda	\u3063\u3061	cchi
\u3063\u3061\u3083	ccha	\u3063\u3061\u3085	cchu	\u3063\u3061\u3087	ccho	\u3063\u3062	ddi
\u3063\u3062\u3083	ddya	\u3063\u3062\u3085	ddyu	\u3063\u3062\u3087	ddyo	\u3063\u3064	ttsu
\u3063\u3065	ddu	\u3063\u3066	tte	\u3063\u3067	dde	\u3063\u3068	tto	\u3063\u3069	ddo
\u3063\u306f	hha	\u3063\u3070	bba	\u3063\u3071	ppa	\u3063\u3072	hhi
\u3063\u3072\u3083	hhya	\u3063\u3072\u3085	hhyu	\u3063\u3072\u3087	hhyo	\u3063\u3073	bbi
\u3063\u3073\u3083	bbya	\u3063\u3073\u3085	bbyu	\u3063\u3073\u3087	bbyo	\u3063\u3074	ppi
\u3063\u3074\u3083	ppya	\u3063\u3074\u3085	ppyu	\u3063\u3074\u3087	ppyo	\u3063\u3075	ffu
\u3063\u3075\u3041	ffa	\u3063\u3075\u3043	ffi	\u3063\u3075\u3047	ffe	\u3063\u3075\u3049	ffo
\u3063\u3076	bbu	\u3063\u3077	ppu	\u3063\u3078	hhe	\u3063\u3079	bbe	\u3063\u307a	ppe
\u3063\u307b	hho	\u3063\u307c	bbo	\u3063\u307d	ppo	\u3063\u3084	yya	\u3063\u3086	yyu
\u3063\u3088	yyo	\u3063\u3089	rra	\u3063\u308a	rri	\u3063\u308a\u3083	rrya
\u3063\u308a\u3085	rryu	\u3063\u308a\u3087	rryo	\u3063\u308b	rru	\u3063\u308c	rre
\u3063\u308d	rro

\u3064	tsu	\u3065	du	\u3066	te	\u3067	de	\u3068	to
\u3069	do

\u306a	na	\u306b	ni	\u306b\u3083	nya	\u306b\u3085	nyu	\u306b\u3087	nyo
\u306c	nu	\u306d	ne	\u306e	no

\u306f	ha	\u3070	ba	\u3071	pa	\u3072	hi	\u3072\u3083	hya
\u3072\u3085	hyu	\u3072\u3087	hyo	\u3073	bi	\u3073\u3083	bya	\u3073\u3085	byu
\u3073\u3087	byo	\u3074	pi	\u3074\u3083	pya	\u3074\u3085	pyu	\u3074\u3087	pyo
\u3075	fu	\u3075\u3041	fa	\u3075\u3043	fi	\u3075\u3047	fe	\u3075\u3049	fo
\u3076	bu	\u3077	pu	\u3078	he	\u3079	be	\u307a	pe
\u307b	ho	\u307c	bo	\u307d	po

\u307e	ma	\u307f	mi	\u307f\u3083	mya	\u307f\u3085	myu	\u307f\u3087	myo
\u3080	mu	\u3081	me	\u3082	mo

\u3083	xya	\u3084	ya	\u3085	xyu	\u3086	yu	\u3087	xyo
\u3088	yo

\u3089	ra	\u308a	ri	\u308a\u3083	rya	\u308a\u3085	ryu	\u308a\u3087	ryo
\u308b	ru	\u308c	re	\u308d	ro

\u308e	xwa	\u308f	wa	\u3090	wi	\u3091	we
\u3092	wo	\u3093	n

\u3093	n'
\u3067\u3043	dyi
\u30fc	-
\u3061\u3047	che
\u3063\u3061\u3047	cche
\u3058\u3047	je
`.trim();

const mCustomSource = `
\u3046\u3043	wi
\u3046\u3047	we
\u3060	dha	\u3063\u3067\u3083	ddha
\u3066\u3083	tha	\u3063\u3066\u3083	ttha
\u3066\u3043	thi	\u3063\u3066\u3043	tthi
\u3066\u3085	thu	\u3063\u3066\u3085	tthu
\u3066\u3047	the	\u3063\u3066\u3047	tthe
\u3066\u3087	tho	\u3063\u3066\u3087	ttho
\u3067\u3043	dhi	\u3063\u3067\u3043	ddhi
\u3067\u3085	dhu	\u3063\u3067\u3085	ddhu
\u3067\u3047	dhe	\u3063\u3067\u3047	ddhe
\u3067\u3087	dho	\u3063\u3067\u3087	ddho
\u3069\u3045	dwu	\u3063\u3069\u3045	ddwu
\u3061\u3083	cya	\u3063\u3061\u3083	ccya
\u3061\u3043	cyi	\u3063\u3061\u3043	ccyi
\u3061\u3085	cyu	\u3063\u3061\u3085	ccyu
\u3061\u3047	cye	\u3063\u3061\u3047	ccye
\u3061\u3087	cyo	\u3063\u3061\u3087	ccyo
\u3075\u3083	fya	\u3063\u3075\u3083	ffya
\u3075\u3043	fyi	\u3063\u3075\u3043	ffyi
\u3075\u3085	fyu	\u3063\u3075\u3085	ffyu
\u3075\u3047	fye	\u3063\u3075\u3047	ffye
\u3075\u3087	fyo	\u3063\u3075\u3087	ffyo
\u3050\u3041	gwa	\u3063\u3050\u3041	ggwa
\u3058\u3083	jya	\u3063\u3058\u3083	jjya
\u3058\u3043	jyi	\u3063\u3058\u3043	jjyi
\u3058\u3085	jyu	\u3063\u3058\u3085	jjyu
\u3058\u3047	jye	\u3063\u3058\u3047	jjye
\u3058\u3087	jyo	\u3063\u3058\u3087	jjyo
\u3041	la	\u3063\u3041	lla
\u3043	li	\u3063\u3043	lli
\u3045	lu	\u3063\u3045	llu
\u3047	le	\u3063\u3047	lle
\u3049	lo	\u3063\u3049	llo
\u3083	lya	\u3063\u3083	llya
\u3043	lyi	\u3063\u3043	llyi
\u3085	lyu	\u3063\u3085	llyu
\u3047	lye	\u3063\u3047	llye
\u3087	lyo	\u3063\u3087	llyo
\u308e	lwa	\u3063\u308e	llwa
\u30f5	lka	\u3063\u30f5	llka
\u30f6	lke	\u3063\u30f6	llke
\u3063	ltu	\u3063\u3063	lltu
\u3063	ltsu	\u3063\u3063	lltsu
\u3064\u3041	tsa	\u3063\u3064\u3041	ttsa
\u3064\u3043	tsi	\u3063\u3064\u3043	ttsi
\u3064\u3047	tse	\u3063\u3064\u3047	ttse
\u3064\u3049	tso	\u3063\u3064\u3049	ttso
\u3068\u3045	twu	\u3063\u3068\u3045	ttwu
\u3090	wyi	\u3063\u3090	wwyi
\u3091	wye	\u3063\u3091	wwye
\u30f5	xka	\u3063\u30f5	xxka
\u30f6	xke	\u3063\u30f6	xxke
\u3043	xyi	\u3063\u3043	xxyi
\u3047	xye	\u3063\u3047	xxye
\u3063\u308f	wwa
\u3063\u3046\u3043	wwi
\u3063\u3046	wwu
\u3063\u3046\u3047	wwe
\u3063\u3092	wwo
`.trim();

/* hiragana, katakana */

const mHiraganaKatakanaSource = `
\u3046\u309b  \u30f4|\uff73\uff9e

\u3042  \u30a2|\uff71
\u3044  \u30a4|\uff72
\u3046  \u30a6|\uff73
\u3048  \u30a8|\uff74
\u304a  \u30aa|\uff75

\u3041  \u30a1|\uff67
\u3043  \u30a3|\uff68
\u3045  \u30a5|\uff69
\u3047  \u30a7|\uff6a
\u3049  \u30a9|\uff6b

\u3083  \u30e3|\uff6c
\u3085  \u30e5|\uff6d
\u3087  \u30e7|\uff6e

\u304b  \u30ab|\uff76
\u304d  \u30ad|\uff77
\u304f  \u30af|\uff78
\u3051  \u30b1|\uff79
\u3053  \u30b3|\uff7a

\u3055  \u30b5|\uff7b
\u3057  \u30b7|\uff7c
\u3059  \u30b9|\uff7d
\u305b  \u30bb|\uff7e
\u305d  \u30bd|\uff7f

\u305f  \u30bf|\uff80
\u3061  \u30c1|\uff81
\u3064  \u30c4|\uff82
\u3066  \u30c6|\uff83
\u3068  \u30c8|\uff84

\u306a  \u30ca|\uff85
\u306b  \u30cb|\uff86
\u306c  \u30cc|\uff87
\u306d  \u30cd|\uff88
\u306e  \u30ce|\uff89

\u306f  \u30cf|\uff8a
\u3072  \u30d2|\uff8b
\u3075  \u30d5|\uff8c
\u3078  \u30d8|\uff8d
\u307b  \u30db|\uff8e

\u307e  \u30de|\uff8f
\u307f  \u30df|\uff90
\u3080  \u30e0|\uff91
\u3081  \u30e1|\uff92
\u3082  \u30e2|\uff93

\u3084  \u30e4|\uff94
\u3086  \u30e6|\uff95
\u3088  \u30e8|\uff96

\u3089  \u30e9|\uff97
\u308a  \u30ea|\uff98
\u308b  \u30eb|\uff99
\u308c  \u30ec|\uff9a
\u308d  \u30ed|\uff9b

\u308f  \u30ef|\uff9c
\u3090  \u30f0|\u30f0
\u3091  \u30f1|\u30f1
\u3092  \u30f2|\uff66
\u3093  \u30f3|\uff9d

\u304c  \u30ac|\uff76\uff9e
\u304e  \u30ae|\uff77\uff9e
\u3050  \u30b0|\uff78\uff9e
\u3052  \u30b2|\uff79\uff9e
\u3054  \u30b4|\uff7a\uff9e

\u3056  \u30b6|\uff7b\uff9e
\u3058  \u30b8|\uff7c\uff9e
\u305a  \u30ba|\uff7d\uff9e
\u305c  \u30bc|\uff7e\uff9e
\u305e  \u30be|\uff7f\uff9e


\u3060  \u30c0|\uff80\uff9e
\u3062  \u30c2|\uff81\uff9e
\u3065  \u30c5|\uff82\uff9e
\u3067  \u30c7|\uff83\uff9e
\u3069  \u30c9|\uff84\uff9e

\u3070  \u30d0|\uff8a\uff9e
\u3073  \u30d3|\uff8b\uff9e
\u3076  \u30d6|\uff8c\uff9e
\u3079  \u30d9|\uff8d\uff9e
\u307c  \u30dc|\uff8e\uff9e


\u3071  \u30d1|\uff8a\uff9f
\u3074  \u30d4|\uff8b\uff9f
\u3077  \u30d7|\uff8c\uff9f
\u307a  \u30da|\uff8d\uff9f
\u307d  \u30dd|\uff8e\uff9f

\u30fc  \u30fc|\uff70|-
\u3002  \u3002|\uff61
\u3001  \u3001|\uff64

\u3063  \u30c3|\uff6f
`.trim();



// compatibility for TextTransform
export function isValidInput(input) {
  return isYomi(input);
}

export function normalizeInput(input) {
  return normalizeForYomi(input);
}

export function normalizeKeyInput(input) {
  return hira2roman(
    normalizeForYomi(
      kata2hira(input)
    )
  );
}

export function addLatinModifiers(input) {
  return TextTransform.addLatinModifiers(input);
}

export function removeLatinModifiers(input) {
  return TextTransform.removeLatinModifiers(input);
}

export function normalizeForYomi(input) {
  return kata2hira(
    zenkaku2hankaku((input || '').toLowerCase())
  );
}

export function isYomi(input) {
  input = input || '' ;
  const alphabets = zenkaku2hankaku(input.toLowerCase());
  if (/^[-a-z0-9]+$/i.test(alphabets))
    return true;

  return !kata2hira(input).replace(/[\u3041-\u3093\u309b\u309c\u30fc]/g, '');
}

const mRomanToKana        = [];
const mKanaPatternByRoman = {};
let mRomanInitialCharacterPattern;
let mRomanPattern;

const mKanaToRoman        = [];
const mRomanPatternByKana = {};
let mKanaPattern;

//let mKunreiKana;
//let mKanaToKunreiRoman;
//const mKunreiRomanByKana = {};
//let mHepburnKana;
//let mKanaToHepburnRoman;
//const mHepburnRomanByKana = {};

const mHiraganaByKatakana        = {};
const mKatakanaByHiragana        = {};
const mZenkakuKatakanaByHiragana = {};

let mKatakanaPattern;
let mHiraganaPattern;

{
  const romanPatterns = [];
  const kanaPatterns = [];
  const kanaRomanPairs = `${mCustomSource}\t${mKunreiSource}\t${mHepburnSource}`.trim().split(/\s+/);
  const multipleCharsRoman = new Set();
  for (let i = 0, maxi = kanaRomanPairs.length; i < maxi; i += 2) {
    const kana  = kanaRomanPairs[i];
    const roman = kanaRomanPairs[i+1];
    mRomanToKana.push({ key : roman, char : kana });
    if (roman in mKanaPatternByRoman) {
      if (!mKanaPatternByRoman[roman].includes(kana)) {
        mKanaPatternByRoman[roman] = `${mKanaPatternByRoman[roman]}|${kana}`;
        multipleCharsRoman.add(roman);
      }
    }
    else {
      mKanaPatternByRoman[roman] = kana;
    }
    romanPatterns.push({ key : roman, char : kana });

    mKanaToRoman.push({ key : kana, char : roman });
    mRomanPatternByKana[kana] = roman;
    kanaPatterns.push({ key : kana, char : roman });
  }
  for (const roman of multipleCharsRoman) {
    mKanaPatternByRoman[roman] = optimizeRegExp(`(${mKanaPatternByRoman[roman]})`);
  }

  // Sort in long order so that a longer Romaji sequence precedes.
  const romanSource = romanPatterns
    .sort((a, b) => b.key.length - a.key.length)
    .map(item => item.key)
    .join('|');
  const romanInitialCharacterSource = romanSource
    .replace(/([^\|])[^\|]+(\||$)/g, '$1$2')
    .split('|')
    .sort()
    .join('|')
    .replace(/([^\|])(\|\1)+/g, '$1')
    .replace(/\|/g, '');
  mRomanInitialCharacterPattern = new RegExp(`[${romanInitialCharacterSource}]`, 'i');
  mRomanPattern = new RegExp(`(${romanSource})`, 'ig');

  const kanaSource = kanaPatterns
    .sort((a, b) =>
      (b.key.length - a.key.length) ||
        (mRomanPatternByKana[a.key].length - mRomanPatternByKana[b.key].length))
    .map(item => item.key)
    .join('|');
  mKanaPattern = new RegExp(`(${kanaSource})`, 'ig');

  /*
  mKunreiKana  = mKunreiSource.split(/\s+/).filter((item, index) => index % 2 == 0)
  mKanaToKunreiRoman = mKunreiKana.map((item, index) => {
    mKunreiRomanByKana[item] = mKunreiKana[index];
    return { key : item, char : mKunreiKana[index] };
  });
  */

  /*
  mHepburnKana = mHepburnSource.split(/\s+/).filter((item, index) => index % 2 == 0);
  mKanaToHepburnRoman = mHepburnKana.map((item, index) => {
    mHepburnRomanByKana[item] = mHepburnKana[index];
    return { key : item, char : mHepburnKana[index] };
  });
  */

  const katakanaPatterns = [];
  const hiraganaPatterns = [];
  const hiraganaKatakanaPairs = mHiraganaKatakanaSource.replace(/^\s+|\s+$/g, '').split(/\s+/);
  for (let i = 0, maxi = hiraganaKatakanaPairs.length; i < maxi; i += 2) {
    const hiragana = hiraganaKatakanaPairs[i];
    const katakana = hiraganaKatakanaPairs[i+1];
    katakana.split('|').forEach((katakanaZenkakuOrHankaku, index) => {
      if (katakanaZenkakuOrHankaku == '-')
        return; // 例外
      mHiraganaByKatakana[katakanaZenkakuOrHankaku] = hiragana;
      katakanaPatterns.push(katakanaZenkakuOrHankaku);
      if (index == 0)
        mZenkakuKatakanaByHiragana[hiragana] = katakanaZenkakuOrHankaku;
    });
    mKatakanaByHiragana[hiragana] = `(${katakana})`
      .replace(/\((.)\|(.)\)/, '[$1$2]')
      .replace(/\((.)\|(.)\|(.)\)/, '[$1$2$3]');
    hiraganaPatterns.push(hiragana);
  }

  mKatakanaPattern = new RegExp(`(${katakanaPatterns.join('|')})`, 'ig');
  mHiraganaPattern = new RegExp(`(${hiraganaPatterns.join('|')})`, 'ig');
}


/*
  FIXME: ad hod solution
  tanni   => tan'i
  kannji  => kanji
  hannnou => han'nou
  hannnya => han'nya
*/
function normalizeDoubleN(input) {
  return String(input)
    .toLowerCase()
    .replace(/nn/i, 'n\'')
    .replace(/n\'(?=[^aiueoyn]|$)/, 'n');
}

/*
  Romaji -> Kana
  It can handle both Hepburn and Kunrei sequences.
*/
export function roman2kana(input) {
  return roman2kanaWithMode(input, HIRAGANA);
}
export function roman2kanaWithMode(input, mode = 0) {
  const converter = (mode & HIRAGANA_KATAKANA) ?
    roman2hiraganaAndKatakana :
    (mode & KATAKANA) ?
      roman2katakana :
      roman2hiragana;
  return optimizeRegExp(
    normalizeDoubleN(String(input).toLowerCase())
      .replace(mRomanPattern, converter)
  );
}
function roman2hiragana(character) {
  return mKanaPatternByRoman[character];
}
function roman2katakana(character) {
  return hira2kataPattern(mKanaPatternByRoman[character]);
}
function roman2hiraganaAndKatakana(input) {
  let kanaPattern = mKanaPatternByRoman[input];
  if (kanaPattern.startsWith('['))
    kanaPattern = `(${kanaPattern.substring(1, kanaPattern.length-1).split('').join('|')})`;
  let result = '';
  while (kanaPattern.length > 0) {
    let character;
    if (kanaPattern.startsWith('\u3046\u309b')) { // 「う゛」だけは特例で一文字扱い
      character   = kanaPattern.substring(0, 2);
      kanaPattern = kanaPattern.substring(2);
    }
    else {
      character   = kanaPattern.charAt(0);
      kanaPattern = kanaPattern.substring(1);
    }
    if (/[\(\)\|]/.test(character)) {
      result += character;
    }
    else {
      result += `(${character}|${hira2kataPattern(character).replace(/^\(|\)$/g, '')})`
        .replace(/(.)\|\1/g, '$1');
    }
  }
  return optimizeRegExp(result);
}


/*
  Kana -> Romaji.
  Return Hepburn sequences.
*/
export function hira2roman(input)  {
  return String(input).toLowerCase()
    .replace(mKanaPattern, character => mRomanPatternByKana[character])
    .replace(/n\'(?=[^aeiuoyn]|$)/, 'n');
}

/*
  Romaji -> Romaji
  Normalize into Hepburn sequences.
  e.g. kannzi -> kanji, tiezo -> chiezo
*/
export function toHepburn(_input)  {
/*
  return normalizeDoubleN(String(input).toLowerCase())
    .replace(/\G((?:#{HEPPAT})*?)(#{KUNPAT})/, function(character) {
      return $1 + mKanaToHepburnRoman[$2];
    });
*/
}

/*
  Romaji -> Romaji
  Normalize into Kunrei sequences.
  e.g. kanji -> kanzi, chiezo -> tiezo
*/
export function toKunrei(_input) {
/*
  return normalizeDoubleN(String(input).toLowerCase())
    .replace(/\G((?:#{KUNPAT})*?)(#{HEPPAT})/, function(character) {
      return $1 + mKanaToKunreiRoman[$2];
    });
*/
}

export function expand(input) {
  return expandWithMode(input, HIRAGANA);
}
export function expandWithMode(input, mode) {
  const target = String(input).match(/[-a-z]+$/i);
  if (!target)
    return input;

  if (!(mRomanInitialCharacterPattern).test(target))
    return input;

  const matcher = new RegExp(`^${target}.*$`, 'i');
  const checkedChar = new Set();
  const entries = mRomanToKana.filter(function(item) {
    const matched = matcher.test(item.key) && !checkedChar.has(item.key);
    checkedChar.add(item.key);
    return matched;
  })
    .map(item => roman2kanaWithMode(item.key, mode));

  if (entries.length == 0)
    return input;

  const base            = input.replace(/[-a-z]+$/i, '');
  const lastCharPattern = entries.length > 1 ? `(${entries.join('|')})` : entries[0] ;
  return base + optimizeRegExp(lastCharPattern);
}

export function optimizeRegExp(input) {
  return String(input)
    .replace(/\|\[[^\]|]+\]/g, matched =>
      `|${matched.substring(2, matched.length-1).split('').join('|')}`)
    .replace(/\[[^\]|]+\]\|/g, matched =>
      `${matched.substring(1, matched.length-2).split('').join('|')}|`)
    .replace(/([^\\]|^)\|\|+/g, '$1|')
    .replace(/([^\\]|^)\(\|/g, '$1\(').replace(/([^\\]|^)\|\)/g, '$1\)')
    .replace(/([^\\]|^)\(\)/g, '$1\)')
    .replace(/([^\\]|^)\(([^()\[\]|]*[^()\[\]|\\])\)/g, '$1$2')
    .replace(/([^\\]|^)\[([^()\[\]|\\])\]/g, '$1$2')
    .replace(/\([^()\[\]|](\|[^()\[\]|])+\)/g, matched =>
      `[${Array.from(new Set(matched.substring(1, matched.length-1).split('|'))).join('')}]`);
}


export function hira2kata(input) {
  return joinVoiceMarks(String(input))
    .replace(mHiraganaPattern, character =>
      mZenkakuKatakanaByHiragana[character]);
}

export function hira2kataPattern(input) {
  return joinVoiceMarks(String(input))
    .replace(mHiraganaPattern, character =>
      mKatakanaByHiragana[character]);
}

export function kata2hira(input) {
  return joinVoiceMarks(String(input))
    .replace(mKatakanaPattern, character =>
      mHiraganaByKatakana[character]);
}

export function roman2zen(input) {
  let output = '';
  for(let i = 0; i < input.length; i++) {
    const character = input.charAt(i);
    const charCode  = character.charCodeAt(0);  //      0xff01-0xff5e
    if (charCode >= 0x21 && charCode <= 0x7e)
      output += String.fromCharCode(charCode+0xfee0);
    else
      output += character;
  }
  return output;
}

export function zenkaku2hankaku(input) {
  return String(input)
    .replace(/[\uff10-\uff19\uff21-\uff3a\uff41-\uff5a]/g, matched =>
      String.fromCharCode(matched.charCodeAt(0) - 0xfee0));
}

export function joinVoiceMarks(input) {
  return String(input || '')
    .replace(/[\u304b\u304d\u304f\u3051\u3053\u3055\u3057\u3059\u305b\u305d\u305f\u3061\u3064\u3066\u3068\u306f\u3072\u3075\u3078\u307b\u30a6\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30cf\u30d2\u30d5\u30d8\u30db\uff73\uff76-\uff84\uff8a-\uff8e][\uff9e\u309b]|[\u306f\u3072\u3075\u3078\u307b\u30cf\u30d2\u30d5\u30d8\u30db\uff8a-\uff8e][\uff9f\u309c]/g, joinVoiceMarkOneChar);
}
function joinVoiceMarkOneChar(input) {
  const charCode = input.charCodeAt(0);

  // 全角かな
  if (/^[\u304b\u304d\u304f\u3051\u3053\u3055\u3057\u3059\u305b\u305d\u305f\u3061\u3064\u3066\u3068\u306f\u3072\u3075\u3078\u307b\u30ab\u30ad\u30af\u30b1\u30b3\u30b5\u30b7\u30b9\u30bb\u30bd\u30bf\u30c1\u30c4\u30c6\u30c8\u30cf\u30d2\u30d5\u30d8\u30db][\uff9e\u309b]/.test(input))
    return String.fromCharCode(charCode + 1);

  if (/^[\u306f\u3072\u3075\u3078\u307b\u30cf\u30d2\u30d5\u30d8\u30db][\uff9f\u309c]/.test(input))
    return String.fromCharCode(charCode + 2);

  if (/^[\u30a6\uff73]/.test(input)) // 全角・半角のヴ
    return '\u30f4';

  // 半角カナ
  switch (input) {
    case '\uff76\uff9e': return '\u30ac';
    case '\uff77\uff9e': return '\u30ae';
    case '\uff78\uff9e': return '\u30b0';
    case '\uff79\uff9e': return '\u30b2';
    case '\uff7a\uff9e': return '\u30b4';

    case '\uff7b\uff9e': return '\u30b6';
    case '\uff7c\uff9e': return '\u30b8';
    case '\uff7d\uff9e': return '\u30ba';
    case '\uff7e\uff9e': return '\u30bc';
    case '\uff7f\uff9e': return '\u30be';

    case '\uff80\uff9e': return '\u30c0';
    case '\uff81\uff9e': return '\u30c2';
    case '\uff82\uff9e': return '\u30c5';
    case '\uff83\uff9e': return '\u30c7';
    case '\uff84\uff9e': return '\u30c9';

    case '\uff8a\uff9e': return '\u30d0';
    case '\uff8b\uff9e': return '\u30d3';
    case '\uff8c\uff9e': return '\u30d6';
    case '\uff8d\uff9e': return '\u30d9';
    case '\uff8e\uff9e': return '\u30dc';

    case '\uff8a\uff9f': return '\u30d1';
    case '\uff8b\uff9f': return '\u30d4';
    case '\uff8c\uff9f': return '\u30d7';
    case '\uff8d\uff9f': return '\u30da';
    case '\uff8e\uff9f': return '\u30dd';
  }

  return input;
}
