# BioGears server patches

Patches against the local checkout of the BioGears engine bridge at
`~/Project/_active/biogears-engine/` (origin: `BioGearsEngine/core`,
upstream — no write access).

These were applied locally and committed onto the local `trunk` branch
(commit `4c70be1`). They are kept here as a backup so the bridge can
be rebuilt from scratch if `~/Project/_active/biogears-engine/` is
ever lost or reset.

## Files

- `0001-bg-bridge-fd-isolation-and-NaN-handling.patch` — fixes two
  protocol-corruption bugs in `bridge/bg-bridge.cpp`:
  1. fd-1 isolation so BioGears engine internals can't pollute the
     stdout JSON channel.
  2. `isnan` / `isinf` guard in `jField` so vitals JSON never emits
     bare `nan`.

## Apply

```bash
cd ~/Project/_active/biogears-engine
git apply path/to/0001-bg-bridge-fd-isolation-and-NaN-handling.patch
# or, to land it as a commit:
git am path/to/0001-bg-bridge-fd-isolation-and-NaN-handling.patch

cd bridge/build && make
```

## Cache file

The bridge also depends on
`~/Project/_active/biogears-engine/build/runtime/states/StandardMale-stable.xml`
existing. If missing, the first init takes ~7m51s instead of ~6s. Recover
by either letting one cold init complete (BioGears auto-saves to
`states/states/StandardMale-stable.xml`, which then needs to be moved up
one directory because `LoadState` and `SaveStateToFile` use asymmetric
path resolution), or by copying from a known-good backup.
