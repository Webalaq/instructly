import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';

class TeachingSetupStep extends StatefulWidget {
  const TeachingSetupStep({
    super.key,
    required this.selectedDurations,
    required this.bufferMinutes,
    required this.teachingAreas,
    required this.preferredTestCentres,
    required this.onDurationsChanged,
    required this.onBufferChanged,
    required this.onTeachingAreasChanged,
    required this.onTestCentresChanged,
  });

  final List<int> selectedDurations;
  final int bufferMinutes;
  final List<String> teachingAreas;
  final List<String> preferredTestCentres;
  final ValueChanged<List<int>> onDurationsChanged;
  final ValueChanged<int> onBufferChanged;
  final ValueChanged<List<String>> onTeachingAreasChanged;
  final ValueChanged<List<String>> onTestCentresChanged;

  @override
  State<TeachingSetupStep> createState() => _TeachingSetupStepState();
}

class _TeachingSetupStepState extends State<TeachingSetupStep> {
  final _areaController = TextEditingController();
  final _centreController = TextEditingController();

  static const _durationOptions = [60, 90, 120];
  static const _bufferOptions = [0, 10, 15, 20, 30];

  @override
  void dispose() {
    _areaController.dispose();
    _centreController.dispose();
    super.dispose();
  }

  void _addArea() {
    final text = _areaController.text.trim();
    if (text.isNotEmpty && !widget.teachingAreas.contains(text)) {
      widget.onTeachingAreasChanged([...widget.teachingAreas, text]);
      _areaController.clear();
    }
  }

  void _removeArea(String area) {
    widget.onTeachingAreasChanged(
      widget.teachingAreas.where((a) => a != area).toList(),
    );
  }

  void _addCentre() {
    final text = _centreController.text.trim();
    if (text.isNotEmpty && !widget.preferredTestCentres.contains(text)) {
      widget.onTestCentresChanged([...widget.preferredTestCentres, text]);
      _centreController.clear();
    }
  }

  void _removeCentre(String centre) {
    widget.onTestCentresChanged(
      widget.preferredTestCentres.where((c) => c != centre).toList(),
    );
  }

  void _toggleDuration(int duration) {
    final current = List<int>.from(widget.selectedDurations);
    if (current.contains(duration)) {
      if (current.length > 1) {
        current.remove(duration);
        widget.onDurationsChanged(current);
      }
    } else {
      current.add(duration);
      widget.onDurationsChanged(current);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Teaching Setup',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Configure your lesson preferences and teaching areas.',
          style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 28),

        // Lesson durations
        const Text(
          'Lesson Durations',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 4),
        const Text(
          'Select all that apply (at least one required)',
          style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: _durationOptions.map((d) {
            final selected = widget.selectedDurations.contains(d);
            return FilterChip(
              label: Text('$d min'),
              selected: selected,
              onSelected: (_) => _toggleDuration(d),
              selectedColor: AppColors.primary.withValues(alpha: 0.15),
              checkmarkColor: AppColors.primary,
              labelStyle: TextStyle(
                color: selected ? AppColors.primary : AppColors.textSecondary,
                fontWeight:
                    selected ? FontWeight.w600 : FontWeight.w400,
              ),
              side: BorderSide(
                color: selected
                    ? AppColors.primary
                    : AppColors.textSecondary.withValues(alpha: 0.3),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // Buffer time
        const Text(
          'Buffer Between Lessons',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 10),
        Wrap(
          spacing: 8,
          children: _bufferOptions.map((b) {
            final selected = widget.bufferMinutes == b;
            return ChoiceChip(
              label: Text(b == 0 ? 'None' : '$b min'),
              selected: selected,
              onSelected: (_) => widget.onBufferChanged(b),
              selectedColor: AppColors.primary.withValues(alpha: 0.15),
              checkmarkColor: AppColors.primary,
              labelStyle: TextStyle(
                color: selected ? AppColors.primary : AppColors.textSecondary,
                fontWeight:
                    selected ? FontWeight.w600 : FontWeight.w400,
              ),
              side: BorderSide(
                color: selected
                    ? AppColors.primary
                    : AppColors.textSecondary.withValues(alpha: 0.3),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // Teaching areas
        const Text(
          'Teaching Areas',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 10),
        _TagInputRow(
          controller: _areaController,
          hint: 'e.g. Croydon, Sutton',
          onAdd: _addArea,
        ),
        if (widget.teachingAreas.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: widget.teachingAreas
                .map(
                  (area) => _DeletableChip(
                    label: area,
                    onDelete: () => _removeArea(area),
                  ),
                )
                .toList(),
          ),
        ],
        const SizedBox(height: 24),

        // Preferred test centres
        const Text(
          'Preferred Test Centres',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
          ),
        ),
        const SizedBox(height: 10),
        _TagInputRow(
          controller: _centreController,
          hint: 'e.g. Mitcham, Morden',
          onAdd: _addCentre,
        ),
        if (widget.preferredTestCentres.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: widget.preferredTestCentres
                .map(
                  (centre) => _DeletableChip(
                    label: centre,
                    onDelete: () => _removeCentre(centre),
                  ),
                )
                .toList(),
          ),
        ],
      ],
    );
  }
}

class _TagInputRow extends StatelessWidget {
  const _TagInputRow({
    required this.controller,
    required this.hint,
    required this.onAdd,
  });

  final TextEditingController controller;
  final String hint;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: controller,
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(
                fontSize: 14,
                color: AppColors.textSecondary,
              ),
              isDense: true,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: AppColors.textSecondary.withValues(alpha: 0.3),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: BorderSide(
                  color: AppColors.textSecondary.withValues(alpha: 0.3),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide:
                    const BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
            onSubmitted: (_) => onAdd(),
          ),
        ),
        const SizedBox(width: 8),
        TextButton(
          onPressed: onAdd,
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
              side: const BorderSide(color: AppColors.primary),
            ),
          ),
          child: const Text(
            'Add',
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

class _DeletableChip extends StatelessWidget {
  const _DeletableChip({required this.label, required this.onDelete});

  final String label;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text(
        label,
        style: const TextStyle(
          fontSize: 13,
          color: AppColors.primary,
          fontWeight: FontWeight.w500,
        ),
      ),
      onDeleted: onDelete,
      deleteIconColor: AppColors.primary.withValues(alpha: 0.7),
      backgroundColor: AppColors.primary.withValues(alpha: 0.1),
      side: BorderSide(color: AppColors.primary.withValues(alpha: 0.3)),
      padding: const EdgeInsets.symmetric(horizontal: 4),
    );
  }
}
