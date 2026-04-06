<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->string('commission_type')->default('percentage')->after('commission_rate');
            $table->string('commission_strategy')->default('flat')->after('commission_type');
            $table->json('commission_tiers')->nullable()->after('commission_strategy');
        });
    }

    public function down(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->dropColumn(['commission_type', 'commission_strategy', 'commission_tiers']);
        });
    }
};
