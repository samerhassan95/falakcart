<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->string('bank_name')->nullable()->after('commission_strategy');
            $table->string('account_number')->nullable()->after('bank_name');
            $table->string('account_holder_name')->nullable()->after('account_number');
            $table->string('iban')->nullable()->after('account_holder_name');
            $table->decimal('minimum_payout', 10, 2)->default(50.00)->after('iban');
        });
    }

    public function down(): void
    {
        Schema::table('affiliates', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'account_number', 'account_holder_name', 'iban', 'minimum_payout']);
        });
    }
};